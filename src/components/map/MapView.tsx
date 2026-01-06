import { useEffect, useMemo, useState, useRef } from "react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { ZoomIn, ZoomOut, Navigation2, LocateFixed, Radio } from "lucide-react";
import { MapLegend } from "./MapLegend";
import { ExplorationHeatmap } from "./ExplorationHeatmap";
import { Map as MapGL } from "react-map-gl/maplibre";
import { Marker } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { TripsLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer, ArcLayer, PathLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { Viewer, Entity, PointGraphics, CameraFlyTo } from "resium";
import { Cartesian3, Color, Ion, Viewer as CesiumViewer } from "cesium";
import "maplibre-gl/dist/maplibre-gl.css";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Cesium Ion token (free tier) - for 3D globe basemap
Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk";

// Satellite imagery basemap for cinematic Maxar-style visualization
const MAP_STYLE = "https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL";

// Agent marker data for visualization
interface AgentMarker {
  id: string;
  name: string;
  position: [number, number]; // [x, y] in VW space (mapped to lon, lat for visualization)
  status: string;  // UI-facing status from backend
  color: [number, number, number, number];
  curiosity_score: number;
  knowledge_acquired: number;
  pulseOffset: number; // Unique timing offset for this agent
}

// Agent trail/path data for movement visualization
type AgentTrail = {
  path: [number, number][]; // Array of [lon, lat] positions
  timestamps: number[];      // Monotonic seconds for animation
};

// Helper to safely get numeric value from unknown
function safeNumber(val: unknown, fallback: number = 0): number {
  return typeof val === 'number' ? val : fallback;
}

function pickNumber(metrics: Record<string, unknown> | undefined, keys: string[]): number {
  if (!metrics) return 0;
  for (const key of keys) {
    const num = metrics[key];
    if (typeof num === "number" && Number.isFinite(num)) {
      return num;
    }
  }
  return 0;
}

function getAgentSignals(agent: Agent) {
  const metrics = agent.metrics as Record<string, unknown> | undefined;
  return {
    llmTokens: pickNumber(metrics, ["llm_tokens_total", "llm_tokens", "tokens_used", "token_usage"]),
    comms: pickNumber(metrics, ["messages_sent", "messages_processed", "comms_events", "communication_events", "signals"]),
    web: pickNumber(metrics, ["web_requests", "http_calls", "browser_requests", "internet_calls", "api_calls"]),
  };
}

// Helper to safely get location coordinates from agent
// Backend: location.x = latitude, location.y = longitude
// deck.gl expects: [longitude, latitude]
function getAgentPosition(agent: Agent): [number, number] {
  const loc = agent.location as { x?: number; y?: number; lon?: number; lat?: number } | undefined;
  
  // Debug log to see what location data we're getting
  if (!loc) {
    console.log(`[MapView] Agent ${agent.name} has NO location data, using Sydney default`);
  }
  
  if (loc) {
    // location.x = lat, location.y = lon (per backend EarthlinkLocationMixin)
    const lat = loc.x ?? -33.8688;
    const lon = loc.y ?? 151.2093;
    const position: [number, number] = [safeNumber(lon, 151.2093), safeNumber(lat, -33.8688)];
    console.log(`[MapView] Agent ${agent.name} location:`, { raw: loc, parsed: position });
    return position;
  }
  // Default to Sydney coordinates for visualization [lon, lat]
  return [151.2093, -33.8688];
}

// Default view state - global view to see all agents worldwide
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
};
// Cesium 3D camera settings for global view
const CESIUM_INITIAL_CAMERA = {
  longitude: 0,
  latitude: 20,
  height: 20000000, // 20000km altitude for global view
};
const MAX_TRAIL_POINTS = 120;
// Get centroid of agent positions for auto-centering
function getAgentCentroid(markers: AgentMarker[]): [number, number] {
  if (!markers.length) return [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude];
  const sum = markers.reduce<[number, number]>(
    (acc, m) => [acc[0] + m.position[0], acc[1] + m.position[1]],
    [0, 0]
  );
  return [sum[0] / markers.length, sum[1] / markers.length];
}

// Get color based on agent status - emerald-based palette
function getStatusColor(status?: string): [number, number, number, number] {
  switch (status) {
    case "idle": return [100, 116, 139, 255]; // slate
    case "exploring": return [16, 185, 129, 255]; // emerald (primary)
    case "learning": return [245, 158, 11, 255]; // amber
    case "interacting": return [34, 211, 238, 255]; // cyan
    case "executing": return [34, 197, 94, 255]; // green
    case "adapting": return [167, 139, 250, 255]; // violet
    case "overloaded": return [239, 68, 68, 255]; // red
    case "corrupted": return [220, 38, 38, 255]; // darker red
    case "retired": return [71, 85, 105, 255]; // dark slate
    default: return [16, 185, 129, 255]; // emerald default
  }
}

function getDominantAction(agent: Agent): string | null {
  const dist = agent.metrics?.decision_distribution as Record<string, unknown> | undefined;
  if (!dist) return null;

  const numericEntries = Object.entries(dist).filter(([, v]) => typeof v === "number") as [string, number][];
  if (!numericEntries.length) return null;

  const [bestKey] = numericEntries.reduce<[string, number]>(
    (best, [k, v]) => (v > best[1] ? [k, v] : best),
    ["", Number.NEGATIVE_INFINITY]
  );

  return bestKey || null;
}

// Generate stable unique offset from agent ID (each agent gets consistent pulse timing)
function getAgentPulseOffset(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 100) / 100; // 0-1 range for animation delay
}

export function MapView() {
  const { viewMode, agents, lastAgentUpdateMs, showCoverageOverlay, showSignalOverlay } = useAppStore();
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoveredAgent, setHoveredAgent] = useState<AgentMarker | null>(null);
  const [hoveredDeckObject, setHoveredDeckObject] = useState<any>(null);
  const [, setCesiumViewer] = useState<CesiumViewer | null>(null);
  const mapRef = useRef<MapRef>(null);
  const [agentTrails, setAgentTrails] = useState<Map<string, AgentTrail>>(new Map());
  const [currentTime, setCurrentTime] = useState(() => Date.now() / 1000);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [deckGLReady, setDeckGLReady] = useState(false);
  const [webGLError, setWebGLError] = useState(false);
  
  // Delay DeckGL mount to avoid WebGL context race condition
  // Increased delay and added error handling for WebGL context
  useEffect(() => {
    // Immediate check for WebGL support
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          console.log('[MapView] WebGL support verified');
          setDeckGLReady(true);
          return true;
        } else {
          console.error('[MapView] WebGL not supported');
          setWebGLError(true);
          return false;
        }
      } catch (error) {
        console.error('[MapView] WebGL initialization failed:', error);
        setWebGLError(true);
        return false;
      }
    };
    
    // Try immediately, fallback to delayed check if needed
    if (!checkWebGL()) {
      const timer = setTimeout(() => checkWebGL(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Adjust pitch/bearing based on view mode
function getAgentMetric(agent: Agent, key: string): number {
  const metrics = agent.metrics as Record<string, unknown> | undefined;
  if (!metrics) return 0;
  const val = metrics[key];
  return typeof val === "number" && Number.isFinite(val) ? val : 0;
}

  const adjustedViewState = useMemo(() => {
    switch (viewMode) {
      case "2d":
        return { ...viewState, pitch: 0, bearing: 0 };
      case "2.5d":
        return { ...viewState, pitch: 45, bearing: -15 };
      case "3d":
        return { ...viewState, pitch: 60, bearing: -30 };
      default:
        return viewState;
    }
  }, [viewMode, viewState]);

  // Convert agents from store to map markers (safely handling dynamic backend data)
  const agentMarkers = useMemo((): AgentMarker[] => {
    const markers = agents.map((a) => {
      const position = getAgentPosition(a);
      return {
        id: a.id,
        name: a.name,
        position,
        status: (a.status as string) ?? "idle",
        color: getStatusColor(a.status as string),
        curiosity_score: safeNumber(a.metrics?.curiosity_score),
        knowledge_acquired: safeNumber(a.metrics?.knowledge_acquired),
        pulseOffset: getAgentPulseOffset(a.id), // Stable unique timing based on ID
      };
    });
    
    // Debug logging
    if (markers.length > 0) {
      console.log('[MapView] Agent markers:', markers.map(m => ({ 
        name: m.name, 
        position: m.position, 
        status: m.status 
      })));
    }
    
    return markers;
  }, [agents]);

  // Always generate coverage points for each agent - ensures hexagons render even with no metrics
  const coveragePoints = useMemo(() => {
    return agents.map((agent) => {
      const locVisited = getAgentMetric(agent, "unique_locations_visited");
      const distKm = getAgentMetric(agent, "distance_traveled_km");
      const knowledge = getAgentMetric(agent, "knowledge_acquired");
      // Minimum weight of 1 ensures hexagons always render
      const weight = Math.max(1, locVisited, distKm, knowledge / 100);
      return { position: getAgentPosition(agent), weight };
    });
  }, [agents]);

  // Always generate at least one signal burst per agent for visual presence
  const signalBursts = useMemo(() => {
    return agents.flatMap((agent) => {
      const pos = getAgentPosition(agent);
      const signals = getAgentSignals(agent);
      const color = getStatusColor(agent.status as string);
      const pulseOffset = getAgentPulseOffset(agent.id);
      const bursts: { position: [number, number]; color: [number, number, number, number]; size: number; pulseOffset: number }[] = [];
      
      // Always emit a base presence burst using agent's status color
      bursts.push({ position: pos, color: [color[0], color[1], color[2], 140], size: 15000, pulseOffset });
      
      // Add activity-specific bursts when metrics exist
      if (signals.comms > 0) {
        bursts.push({ position: pos, color: [56, 189, 248, 200], size: 20000 + Math.min(signals.comms, 50) * 600, pulseOffset });
      }
      if (signals.llmTokens > 0) {
        bursts.push({ position: pos, color: [96, 165, 250, 180], size: 18000 + Math.min(signals.llmTokens, 200) * 150, pulseOffset });
      }
      if (signals.web > 0) {
        bursts.push({ position: pos, color: [251, 191, 36, 200], size: 16000 + Math.min(signals.web, 50) * 400, pulseOffset });
      }
      return bursts;
    });
  }, [agents]);

  // Always draw communication arcs between nearby agents - creates network visualization
  const commsArcs = useMemo(() => {
    const markers = agentMarkers;
    if (markers.length < 2) return [];
    
    const arcs: { sourcePosition: [number, number]; targetPosition: [number, number]; weight: number; sourceColor: [number, number, number, number]; targetColor: [number, number, number, number] }[] = [];
    
    // Create arcs from each agent to their 2 nearest neighbors
    for (const source of markers) {
      const srcAgent = agents.find((a) => a.id === source.id);
      const comms = srcAgent ? getAgentSignals(srcAgent).comms : 0;
      
      // Sort other agents by distance
      const others = markers
        .filter((t) => t.id !== source.id)
        .map((target) => {
          const dx = target.position[0] - source.position[0];
          const dy = target.position[1] - source.position[1];
          return { target, dist: Math.sqrt(dx * dx + dy * dy) };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2); // Connect to 2 nearest
      
      for (const { target } of others) {
        arcs.push({
          sourcePosition: source.position,
          targetPosition: target.position,
          weight: Math.max(1, comms),
          sourceColor: source.color,
          targetColor: target.color,
        });
      }
    }
    return arcs;
  }, [agentMarkers, agents]);

  // Track agent trails with timestamps for animated fading tails
  useEffect(() => {
    setAgentTrails((prev) => {
      const next = new Map(prev);
      agentMarkers.forEach((agent) => {
        const trail = next.get(agent.id) || { path: [], timestamps: [] };
        const lastPos = trail.path[trail.path.length - 1];
        const now = Date.now() / 1000;
        // Only add if position changed
        if (!lastPos || lastPos[0] !== agent.position[0] || lastPos[1] !== agent.position[1]) {
          const newPath = [...trail.path, agent.position].slice(-MAX_TRAIL_POINTS);
          const newTimestamps = [...trail.timestamps, now].slice(-MAX_TRAIL_POINTS);
          next.set(agent.id, { path: newPath, timestamps: newTimestamps });
        }
      });
      return next;
    });
  }, [agentMarkers]);

  // Drive deck.gl time uniforms so trails fade at the tail
  useEffect(() => {
    let frame: number;
    const animate = () => {
      const t = Date.now();
      setCurrentTime(t / 1000);
      setNowMs(t);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const isStale = useMemo(() => {
    if (!lastAgentUpdateMs) return true;
    return nowMs - lastAgentUpdateMs > 8000;
  }, [lastAgentUpdateMs, nowMs]);

  const deckLayers = useMemo(() => {
    // Don't create layers if WebGL is not ready or has errors
    if (!deckGLReady || webGLError) {
      console.log('[MapView] DeckGL not ready or has error, skipping layers');
      return [];
    }
    
    console.log('[MapView] Creating deck.gl DATA ANALYSIS layers...', {
      agentMarkers: agentMarkers.length,
      trails: agentTrails.size,
      coveragePoints: coveragePoints.length,
      showCoverage: showCoverageOverlay,
      showSignals: showSignalOverlay,
      viewMode
    });
    
    // deck.gl for VISUAL EXPLORATORY DATA ANALYSIS
    // Understanding agent behavior: what they explore, learn, how curiosity drives them
    const layers = [];
    
    // EXPLORATION TRAJECTORIES - Visualize agent movement through information/geographic space
    const trailData = Array.from(agentTrails.entries())
      .map(([id, trail]) => {
        const marker = agentMarkers.find((a) => a.id === id);
        const agent = agents.find(a => a.id === id);
        return { 
          id, 
          path: trail.path, 
          timestamps: trail.timestamps, 
          color: marker?.color || [255, 255, 255, 255],
          agent
        };
      })
      .filter((d) => d.path.length > 1);
    
    console.log('[MapView] Trail data:', {
      trailData: trailData.length,
      sampleTrail: trailData[0],
      agentTrailsSize: agentTrails.size
    });
    
    if (trailData.length > 0 && showCoverageOverlay) {
      layers.push(
        // AGENT MOVEMENT TRAJECTORIES - Animated trips showing exploration paths
        // Proper TripsLayer configuration matching NYC taxi trips example
        new TripsLayer({
          id: "exploration-trajectories",
          data: trailData,
          getPath: (d: any) => d.path,
          getTimestamps: (d: any) => d.timestamps,
          getColor: (d: any) => d.color || [253, 128, 93], // Default orange
          
          // Animation configuration
          opacity: 0.8,
          widthMinPixels: 2,
          widthMaxPixels: 8,
          trailLength: 180, // 180 seconds of history visible
          fadeTrail: true,
          currentTime,
          
          // Visual styling
          capRounded: true,
          jointRounded: true,
          pickable: true,
          
          // Rendering options
          shadowEnabled: false, // Disable for performance
          parameters: { 
            depthTest: false // Trails always visible above terrain
          }
        }) as any
      );
    }

    // SPATIAL EXPLORATION DENSITY - 3D elevated hexagons showing exploration intensity
    // Proper deck.gl HexagonLayer configuration matching UK Road Safety example
    console.log('[MapView] Hexagon layer check:', {
      showCoverageOverlay,
      coveragePointsLength: coveragePoints.length,
      viewMode,
      elevationScale: viewMode === "2.5d" ? 5000 : viewMode === "3d" ? 5000 : 2000, // Show in 2D with lower scale
      samplePoint: coveragePoints[0]
    });
    
    if (showCoverageOverlay && coveragePoints.length > 0) {
      layers.push(
        new HexagonLayer({
          id: "exploration-density",
          data: coveragePoints,
          gpuAggregation: true, // Enable GPU acceleration for large datasets
          getPosition: (d: any) => d.position,
          getElevationWeight: (d: any) => d.weight,
          getColorWeight: (d: any) => d.weight,
          
          // 3D Extrusion - height represents exploration intensity
          extruded: true,
          elevationScale: viewMode === "2.5d" ? 5000 : viewMode === "3d" ? 5000 : 2000, // Visible even in 2D
          elevationRange: [0, 3000], // Min/max elevation in meters
          
          // Spatial aggregation controls
          radius: 2000, // 2km hexagons for city-scale patterns
          coverage: 0.7, // 70% coverage - professional appearance
          upperPercentile: 100, // Include all data points
          
          // Color encoding - gradient from low to high exploration
          colorRange: [
            [1, 152, 189],    // Deep blue - minimal exploration
            [73, 227, 206],   // Turquoise
            [216, 254, 181],  // Light green
            [254, 237, 177],  // Yellow-green
            [254, 173, 84],   // Orange
            [209, 55, 78]     // Red - intense exploration hotspots
          ],
          
          // Visual enhancement
          pickable: true,
          opacity: 0.8,
          material: {
            ambient: 0.64,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [51, 51, 51]
          },
          
          // Smooth transitions when data updates
          transitions: {
            elevationScale: 600
          }
        }) as any
      );
    }

    // KNOWLEDGE ACQUISITION & CURIOSITY ANALYSIS
    // Visualize what agents are learning and why
    if (showSignalOverlay) {
      const knowledgeData = agents.map(agent => {
        const pos = getAgentPosition(agent);
        const knowledge = getAgentMetric(agent, 'knowledge_acquired') || 0;
        const curiosity = getAgentMetric(agent, 'curiosity_score') || 0;
        const uniqueLocations = getAgentMetric(agent, 'unique_locations_visited') || 0;
        
        return {
          position: pos,
          knowledge,
          curiosity,
          uniqueLocations,
          name: agent.name,
          lifecycle: agent.lifecycle
        };
      }).filter(d => d.knowledge > 0 || d.curiosity > 0);
      
      if (knowledgeData.length > 0) {
        layers.push(
          // KNOWLEDGE ACQUISITION - Size by knowledge, color by curiosity
          new ScatterplotLayer({
            id: "knowledge-acquisition",
            data: knowledgeData,
            getPosition: (d: any) => d.position,
            
            // Color encoding - curiosity drives exploration
            getFillColor: (d: any) => {
              // Gradient from red (low curiosity) to blue (high curiosity)
              const curiosity = d.curiosity;
              return [
                255 * (1 - curiosity), // Red component decreases
                100,                   // Constant green
                255 * curiosity,       // Blue component increases
                200
              ];
            },
            
            // Size encoding - knowledge accumulation
            getRadius: (d: any) => Math.max(2000, Math.sqrt(d.knowledge) * 1000),
            radiusUnits: "meters",
            radiusMinPixels: 10,
            radiusMaxPixels: 40,
            
            // Visual styling
            stroked: true,
            filled: true,
            lineWidthMinPixels: 2,
            getLineColor: [255, 255, 255, 255],
            pickable: true,
            opacity: 0.75,
            
            // Smooth transitions
            transitions: {
              getRadius: 500,
              getFillColor: 500
            }
          }) as any,
          
          // AGENT PROXIMITY NETWORK - Connection arcs showing potential knowledge exchange
          // Proper ArcLayer configuration matching US migration example
          new ArcLayer({
            id: "agent-proximity-network",
            data: commsArcs,
            
            // Position accessors
            getSourcePosition: (d: any) => d.sourcePosition,
            getTargetPosition: (d: any) => d.targetPosition,
            
            // Color gradient - source to target
            getSourceColor: [180, 232, 255, 120],  // Light blue source
            getTargetColor: [100, 180, 255, 80],    // Deeper blue target
            
            // Arc styling
            getWidth: 1.5,
            getHeight: 0.15,  // Gentle curve for visibility
            getTilt: 0,       // No rotation
            
            // Rendering options
            greatCircle: true,  // Follow Earth curvature
            numSegments: 50,    // Smooth curve
            pickable: true,
            
            // Always visible above terrain
            parameters: { 
              depthTest: false 
            }
          }) as any
        );
      }
    }
    
    console.log('[MapView] Created', layers.length, 'deck.gl layers');

    return layers;
  }, [deckGLReady, webGLError, agentMarkers, agentTrails, commsArcs, coveragePoints, currentTime, showCoverageOverlay, showSignalOverlay, signalBursts, viewMode]);

  // Zoom controls
  const handleZoomIn = () => setViewState((s) => ({ ...s, zoom: Math.min(s.zoom + 1, 20) }));
  const handleZoomOut = () => setViewState((s) => ({ ...s, zoom: Math.max(s.zoom - 1, 1) }));
  const handleResetZoom = () => {
    if (agentMarkers.length > 0) {
      const [lon, lat] = getAgentCentroid(agentMarkers);
      setViewState((s) => ({ ...s, longitude: lon, latitude: lat, zoom: INITIAL_VIEW_STATE.zoom }));
    } else {
      setViewState(INITIAL_VIEW_STATE);
    }
  };

  const handleNorthUp = () => {
    setViewState((s) => ({ ...s, bearing: 0, pitch: viewMode === "2d" ? 0 : viewMode === "2.5d" ? 45 : 60 }));
  };

  // Convert RGBA to Cesium Color
  const toCesiumColor = (rgba: [number, number, number, number]): Color => {
    return new Color(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3] / 255);
  };

  return (
    <div className="relative w-full h-full bg-[var(--color-bg-primary)] overflow-hidden">
      {/* 
        Visualization Architecture:
        - 2D: MapLibre (basemap) + deck.gl (viz layer)
        - 2.5D: MapLibre (basemap) + deck.gl (viz layer with pitch)
        - 3D: Cesium (3D globe basemap) + deck.gl (viz layer overlay)
      */}
      
      {viewMode === "3d" ? (
        // 3D Mode: Cesium Globe (basemap) + deck.gl overlays (viz layer)
        <div className="relative w-full h-full">
          {/* Cesium 3D Globe - Base Layer */}
          <Viewer 
            full
            ref={(e) => setCesiumViewer(e?.cesiumElement ?? null)}
            timeline={false}
            animation={false}
            baseLayerPicker={false}
            geocoder={false}
            homeButton={false}
            sceneModePicker={false}
            navigationHelpButton={false}
            fullscreenButton={false}
            vrButton={false}
            infoBox={true}
            selectionIndicator={true}
          >
            {/* Removed auto-center on agents - map should stay at initial position */}
            
            {/* Agent entities on globe */}
            {agentMarkers.map((marker) => (
              <Entity
                key={marker.id}
                name={marker.name}
                description={`<b>Status:</b> ${marker.status}<br/><b>Knowledge:</b> ${marker.knowledge_acquired.toFixed(1)}<br/><b>Curiosity:</b> ${(marker.curiosity_score * 100).toFixed(0)}%`}
                position={Cartesian3.fromDegrees(marker.position[0], marker.position[1], 0)}
              >
                <PointGraphics
                  pixelSize={14}
                  color={toCesiumColor(marker.color)}
                  outlineColor={Color.WHITE}
                  outlineWidth={2}
                />
              </Entity>
            ))}
          </Viewer>
          
          {/* TODO: deck.gl overlay on Cesium for advanced visualizations */}
          {/* This will allow heatmaps, arcs, trajectories, etc. on the 3D globe */}
        </div>
      ) : (
        // 2D/2.5D Mode: MapLibre with Tailwind HTML markers + deck.gl trails
        <>
          <MapGL
            ref={mapRef}
            {...adjustedViewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle={MAP_STYLE}
            attributionControl={false}
            renderWorldCopies={false}
          >
            {/* Agent markers with activity badge */}
            {agentMarkers.map((marker) => {
              const colorRgb = `rgb(${marker.color[0]}, ${marker.color[1]}, ${marker.color[2]})`;
              const agent = agents.find((a) => a.id === marker.id);
              const dominantAction = agent ? getDominantAction(agent) : null;
              
              return (
                <Marker
                  key={marker.id}
                  longitude={marker.position[0]}
                  latitude={marker.position[1]}
                  anchor="center"
                >
                  <div className="relative w-10 h-10 flex items-center justify-center cursor-pointer"
                       onMouseEnter={() => setHoveredAgent(marker)}
                       onMouseLeave={() => setHoveredAgent(null)}>
                    {/* Outward pulsing ring */}
                    <div 
                      className="absolute w-8 h-8 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: colorRgb,
                        animationDelay: `${marker.pulseOffset}s`
                      }}
                    />
                    
                    {/* Core orb */}
                    <div 
                      className="relative w-3 h-3 rounded-full bg-white"
                      style={{ boxShadow: `0 0 14px 6px ${colorRgb}` }}
                    />

                    {/* Activity badge */}
                    {dominantAction && (
                      <div className="absolute -bottom-2 px-2 py-0.5 text-[10px] rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow"
                        style={{ color: colorRgb }}
                        title={`Last dominant action: ${dominantAction}`}>
                        {dominantAction}
                      </div>
                    )}
                  </div>
                </Marker>
              );
            })}
          </MapGL>

          {/* deck.gl overlay for visualization effects (trails, heatmaps, signals) */}
          {/* Properly integrated with MapLibre GL using absolute positioning */}
          {!webGLError && deckGLReady && (
            <DeckGL
              viewState={adjustedViewState}
              controller={true}
              onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState)}
              layers={deckLayers}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto'
              }}
              onHover={(info) => {
                if (info.object) {
                  setHoveredDeckObject(info);
                } else {
                  setHoveredDeckObject(null);
                }
              }}
              getCursor={() => hoveredDeckObject ? 'pointer' : 'grab'}
              onWebGLInitialized={(gl) => {
                if (!gl) {
                  console.error('[DeckGL] WebGL context not initialized');
                  setWebGLError(true);
                } else {
                  console.log('[DeckGL] WebGL context initialized successfully');
                }
              }}
              onError={(error) => {
                console.error('[DeckGL] Error:', error);
                setWebGLError(true);
              }}
              onLoad={() => {
                console.log('[DeckGL] Loaded and ready');
              }}
            />
          )}
          
          {/* WebGL Error Message */}
          {webGLError && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-3 bg-[var(--color-bg-elevated)]/95 backdrop-blur border border-[var(--color-border)] rounded-lg shadow-lg text-[var(--color-text-muted)] text-sm">
              ⚠️ WebGL visualization layers unavailable. Map markers still visible.
            </div>
          )}
        </>
      )}

      {/* Agent Hover Tooltip */}
      {viewMode !== "3d" && hoveredAgent && !hoveredDeckObject && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--color-bg-elevated)]/95 backdrop-blur border border-[var(--color-border)] rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `rgb(${hoveredAgent.color.slice(0, 3).join(",")})` }}
            />
            <span className="font-medium text-[var(--color-text-primary)]">{hoveredAgent.name}</span>
            <span className="text-xs text-[var(--color-text-muted)] capitalize px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] rounded">
              {hoveredAgent.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
            <span>Knowledge: {hoveredAgent.knowledge_acquired.toFixed(1)}</span>
            <span>Curiosity: {(hoveredAgent.curiosity_score * 100).toFixed(0)}%</span>
            {(() => {
              const agent = agents.find((a) => a.id === hoveredAgent.id);
              const status = agent?.status as string | undefined;
              const lastAction = agent ? getDominantAction(agent) : null;
              const signals = agent ? getAgentSignals(agent) : null;
              return (
                <>
                  {status && <span>Status: {status}</span>}
                  {lastAction && <span>Action: {lastAction}</span>}
                  {signals && signals.comms > 0 && <span>Comms: {signals.comms}</span>}
                  {signals && signals.llmTokens > 0 && <span>LLM: {signals.llmTokens}</span>}
                  {signals && signals.web > 0 && <span>Web/API: {signals.web}</span>}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* deck.gl Layer Tooltip */}
      {viewMode !== "3d" && hoveredDeckObject && hoveredDeckObject.object && (
        <div 
          className="absolute px-3 py-2 bg-[var(--color-bg-elevated)]/95 backdrop-blur border border-[var(--color-border)] rounded-lg shadow-lg text-xs"
          style={{
            left: hoveredDeckObject.x + 10,
            top: hoveredDeckObject.y + 10,
            pointerEvents: 'none'
          }}
        >
          {hoveredDeckObject.layer?.id === 'knowledge-acquisition' && (
            <div className="space-y-1">
              <div className="font-semibold text-[var(--color-text-primary)]">{hoveredDeckObject.object.name}</div>
              <div className="text-[var(--color-text-muted)] space-y-0.5">
                <div>Lifecycle: <span className="text-[var(--color-text-primary)]">{hoveredDeckObject.object.lifecycle || 'unknown'}</span></div>
                <div>Knowledge Acquired: <span className="text-[var(--color-accent)]">{hoveredDeckObject.object.knowledge.toFixed(1)}</span></div>
                <div>Curiosity Score: <span className="text-[var(--color-accent)]">{(hoveredDeckObject.object.curiosity * 100).toFixed(0)}%</span></div>
                <div>Locations Visited: {hoveredDeckObject.object.uniqueLocations}</div>
              </div>
            </div>
          )}
          {hoveredDeckObject.layer?.id === 'exploration-density' && (
            <div className="space-y-1">
              <div className="font-semibold text-[var(--color-text-primary)]">Exploration Density</div>
              <div className="text-[var(--color-text-muted)]">
                <div>Agent Count: {hoveredDeckObject.object.points?.length || 0}</div>
                <div>Activity Level: {(hoveredDeckObject.object.colorValue || 0).toFixed(1)}</div>
              </div>
            </div>
          )}
          {hoveredDeckObject.layer?.id === 'exploration-trajectories' && (
            <div className="space-y-1">
              <div className="font-semibold text-[var(--color-text-primary)">Exploration Path</div>
              <div className="text-[var(--color-text-muted)]">
                <div>Waypoints: {hoveredDeckObject.object.path.length}</div>
                <div>Time Span: {((hoveredDeckObject.object.timestamps[hoveredDeckObject.object.timestamps.length - 1] - hoveredDeckObject.object.timestamps[0]) / 60).toFixed(1)} min</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Controls - Top Right (only for 2D/2.5D, Cesium has native controls) */}
      {viewMode !== "3d" && (
        <div className="absolute top-4 right-4 flex flex-col gap-1">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={handleResetZoom}
          className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="Reset zoom to default"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
        <button 
          onClick={handleNorthUp}
          className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          title="North up"
        >
          <Navigation2 className="w-4 h-4" />
        </button>
      </div>
      )}

      {/* Agent Count Badge - Top Left */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)]/80 backdrop-blur border border-[var(--color-border)] rounded-full">
        <Radio className="w-3.5 h-3.5 text-[var(--color-accent)]" />
        <span className="text-xs text-[var(--color-text-secondary)]">{agentMarkers.length} agents</span>
        {isStale && (
          <span className="text-[10px] text-[var(--color-warning)] bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--color-border-subtle)]" title="No live agent updates received recently">
            No live updates
          </span>
        )}
      </div>

      {/* Coordinates - Bottom Right (only for 2D/2.5D) */}
      {viewMode !== "3d" && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[var(--color-bg-elevated)]/80 backdrop-blur border border-[var(--color-border)] rounded-full text-xs text-[var(--color-text-muted)] font-mono">
          {viewState.latitude.toFixed(4)}°, {viewState.longitude.toFixed(4)}° | Zoom: {viewState.zoom.toFixed(1)}
        </div>
      )}

      {/* Agent Status Legend - Bottom Left */}
      {viewMode !== "3d" && <MapLegend />}

      {/* Exploration Heatmap Overlay */}
      {viewMode !== "3d" && showCoverageOverlay && <ExplorationHeatmap />}
    </div>
  );
}

