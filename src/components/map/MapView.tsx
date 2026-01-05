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
  if (loc) {
    // location.x = lat, location.y = lon (per backend EarthlinkLocationMixin)
    const lat = loc.x ?? -33.8688;
    const lon = loc.y ?? 151.2093;
    return [safeNumber(lon, 151.2093), safeNumber(lat, -33.8688)];
  }
  // Default to Sydney coordinates for visualization [lon, lat]
  return [151.2093, -33.8688];
}

// Default view state - focus on Australia (VW twin)
const INITIAL_VIEW_STATE = {
  longitude: 133.7751,
  latitude: -25.2744,
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
};
// Cesium 3D camera settings for Australia
const CESIUM_INITIAL_CAMERA = {
  longitude: 133.7751,
  latitude: -25.2744,
  height: 5000000, // 5000km altitude for continent view
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
  const [, setCesiumViewer] = useState<CesiumViewer | null>(null);
  const mapRef = useRef<MapRef>(null);
  const [agentTrails, setAgentTrails] = useState<Map<string, AgentTrail>>(new Map());
  const [currentTime, setCurrentTime] = useState(() => Date.now() / 1000);
  const [nowMs, setNowMs] = useState(() => Date.now());

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
  // Constrain to Australia bounding box (lon 110..155, lat -45..-10)
  const agentMarkers = useMemo((): AgentMarker[] => {
    return agents
      .map((a) => {
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
      })
      .filter((m) => {
        const [lon, lat] = m.position;
        return lon >= 110 && lon <= 155 && lat >= -45 && lat <= -10;
      });
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
    const layers = [
      // Large agent presence halos - always visible at any zoom
      new ScatterplotLayer({
        id: "agent-presence-halo",
        data: agentMarkers,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => {
          const pulse = 0.4 + 0.2 * Math.sin((currentTime + d.pulseOffset) * 2);
          return [d.color[0], d.color[1], d.color[2], Math.floor(80 * pulse)];
        },
        getRadius: 200000,
        radiusUnits: "meters",
        radiusMinPixels: 30,
        radiusMaxPixels: 200,
        stroked: false,
        pickable: false,
        opacity: 0.7,
        parameters: { depthTest: false },
        updateTriggers: { getFillColor: [currentTime] },
      }),
      // Glow layer under trails for neon effect
      new PathLayer({
        id: "agent-trails-glow",
        data: Array.from(agentTrails.entries())
          .map(([id, trail]) => {
            const marker = agentMarkers.find((a) => a.id === id);
            return { id, path: trail.path, color: marker?.color || [255, 255, 255, 255] };
          })
          .filter((d) => d.path.length > 1),
        getPath: (d: any) => d.path,
        getColor: (d: any) => [...d.color.slice(0, 3), 60] as [number, number, number, number],
        getWidth: 18,
        widthUnits: "pixels",
        widthMinPixels: 8,
        widthMaxPixels: 24,
        capRounded: true,
        jointRounded: true,
        billboard: false,
        pickable: false,
        parameters: { depthTest: false },
      }),
      new TripsLayer({
        id: "agent-trails",
        data: Array.from(agentTrails.entries())
          .map(([id, trail]) => {
            const marker = agentMarkers.find((a) => a.id === id);
            return { id, trail, color: marker?.color || [255, 255, 255, 255] };
          })
          .filter((d) => d.trail.path.length > 1),
        getPath: (d: any) => d.trail.path,
        getTimestamps: (d: any) => d.trail.timestamps,
        getColor: (d: any) => [...d.color.slice(0, 3), 220] as [number, number, number, number],
        opacity: 1,
        widthMinPixels: 3,
        widthMaxPixels: 8,
        trailLength: 120,
        fadeTrail: true,
        currentTime,
        capRounded: true,
        jointRounded: true,
        shadowEnabled: false,
        parameters: { depthTest: false },
      }),
    ];

    if (showCoverageOverlay) {
      layers.push(
        new HexagonLayer({
          id: "coverage-hexagon",
          data: coveragePoints,
          getPosition: (d: any) => d.position,
          getElevationWeight: (d: any) => d.weight,
          getColorWeight: (d: any) => d.weight,
          elevationScale: viewMode === "2.5d" ? 8000 : 0,
          extruded: viewMode === "2.5d",
          radius: 50000,
          coverage: 0.9,
          upperPercentile: 100,
          colorRange: [
            [0, 60, 80, 180],
            [0, 120, 140, 200],
            [20, 180, 160, 220],
            [60, 220, 180, 235],
            [120, 255, 200, 250],
            [180, 255, 240, 255],
          ],
          elevationRange: [0, 100000],
          pickable: false,
          opacity: 0.85,
          material: {
            ambient: 0.7,
            diffuse: 0.9,
            shininess: 50,
            specularColor: [80, 200, 220],
          },
        }) as any
      );
    }

    if (showSignalOverlay) {
      layers.push(
        new ScatterplotLayer({
          id: "signal-overlay-core",
          data: signalBursts,
          getPosition: (d: any) => d.position,
          getFillColor: (d: any) => {
            const pulse = 0.5 + 0.5 * Math.sin((currentTime + d.pulseOffset) * 4);
            return [d.color[0], d.color[1], d.color[2], Math.floor(d.color[3] * pulse)] as [number, number, number, number];
          },
          getRadius: (d: any) => d.size * 0.5,
          radiusUnits: "meters",
          radiusMinPixels: 8,
          stroked: false,
          pickable: false,
          opacity: 0.9,
          parameters: { depthTest: false },
          updateTriggers: { getFillColor: [currentTime] },
        }) as any,
        new ScatterplotLayer({
          id: "signal-overlay-ring",
          data: signalBursts,
          getPosition: (d: any) => d.position,
          getFillColor: () => [0, 0, 0, 0] as [number, number, number, number],
          getLineColor: (d: any) => {
            const phase = ((currentTime + d.pulseOffset) * 2) % 1;
            const alpha = Math.floor(220 * (1 - phase));
            return [d.color[0], d.color[1], d.color[2], alpha] as [number, number, number, number];
          },
          getRadius: (d: any) => {
            const phase = ((currentTime + d.pulseOffset) * 2) % 1;
            return d.size * (0.6 + phase * 1.5);
          },
          radiusUnits: "meters",
          radiusMinPixels: 12,
          stroked: true,
          filled: false,
          lineWidthMinPixels: 3,
          lineWidthMaxPixels: 6,
          pickable: false,
          opacity: 0.85,
          parameters: { depthTest: false },
          updateTriggers: {
            getLineColor: [currentTime],
            getRadius: [currentTime],
          },
        }) as any,
        new ArcLayer({
          id: "comms-arcs",
          data: commsArcs,
          getSourcePosition: (d: any) => d.sourcePosition,
          getTargetPosition: (d: any) => d.targetPosition,
          getSourceColor: (d: any) => {
            const pulse = 0.6 + 0.4 * Math.sin(currentTime * 3 + d.weight);
            const c = d.sourceColor;
            return [c[0], c[1], c[2], Math.floor(200 * pulse)];
          },
          getTargetColor: (d: any) => {
            const pulse = 0.6 + 0.4 * Math.sin(currentTime * 3 + d.weight + 1.5);
            const c = d.targetColor;
            return [c[0], c[1], c[2], Math.floor(180 * pulse)];
          },
          getWidth: (d: any) => 3 + Math.min(d.weight, 60) * 0.2,
          getHeight: 0.4,
          greatCircle: true,
          numSegments: 64,
          pickable: false,
          parameters: { depthTest: false },
          updateTriggers: {
            getSourceColor: [currentTime],
            getTargetColor: [currentTime],
          },
        }) as any
      );
    }

    return layers;
  }, [agentMarkers, agentTrails, commsArcs, coveragePoints, currentTime, showCoverageOverlay, showSignalOverlay, signalBursts, viewMode]);

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
            {/* Auto-center on agents */}
            {agentMarkers.length > 0 && (
              <CameraFlyTo 
                destination={Cartesian3.fromDegrees(
                  getAgentCentroid(agentMarkers)[0],
                  getAgentCentroid(agentMarkers)[1],
                  CESIUM_INITIAL_CAMERA.height
                )}
                duration={2}
              />
            )}
            
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

          {/* deck.gl overlay for agent movement trails */}
          <DeckGL
            viewState={adjustedViewState}
            controller={false}
            layers={deckLayers}
            style={{ pointerEvents: 'none' }}
          />
        </>
      )}

      {/* Agent Hover Tooltip */}
      {viewMode !== "3d" && hoveredAgent && (
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

