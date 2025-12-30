import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { Map as MapIcon, Layers, Globe2, ZoomIn, ZoomOut, Crosshair, Bot } from "lucide-react";
import { Map as MapGL } from "react-map-gl/maplibre";
import { Marker } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { PathLayer } from "@deck.gl/layers";
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
interface AgentTrail {
  id: string;
  path: [number, number][]; // Array of [lon, lat] positions
  color: [number, number, number, number];
  timestamps: number[]; // For animation
}

// Helper to safely get numeric value from unknown
function safeNumber(val: unknown, fallback: number = 0): number {
  return typeof val === 'number' ? val : fallback;
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

// Default view state - normal view (no zoom)
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
};
// Cesium 3D camera settings for Australia
const CESIUM_INITIAL_CAMERA = {
  longitude: 133.7751,
  latitude: -25.2744,
  height: 5000000, // 5000km altitude for continent view
};
// Get centroid of agent positions for auto-centering
function getAgentCentroid(markers: AgentMarker[]): [number, number] {
  if (!markers.length) return [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude];
  const sum = markers.reduce(
    (acc, m) => [acc[0] + m.position[0], acc[1] + m.position[1]],
    [0, 0] as [number, number]
  );
  return [sum[0] / markers.length, sum[1] / markers.length];
}

// Get color based on agent status - vibrant neon-like colors
function getStatusColor(status?: string): [number, number, number, number] {
  switch (status) {
    case "idle": return [120, 200, 255, 255]; // Bright cyan
    case "exploring": return [0, 255, 150, 255]; // Bright emerald
    case "learning": return [255, 200, 0, 255]; // Bright gold
    case "interacting": return [80, 180, 255, 255]; // Bright blue
    case "executing": return [0, 255, 120, 255]; // Bright green
    case "adapting": return [200, 100, 255, 255]; // Bright purple
    case "overloaded": return [255, 100, 100, 255]; // Bright red
    case "corrupted": return [255, 50, 50, 255]; // Alert red
    case "retired": return [180, 180, 180, 255]; // Gray
    default: return [0, 255, 255, 255]; // Bright cyan default
  }
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
  const { viewMode, agents } = useAppStore();
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoveredAgent, setHoveredAgent] = useState<AgentMarker | null>(null);
  const [cesiumViewer, setCesiumViewer] = useState<CesiumViewer | null>(null);
  const mapRef = useRef<MapRef>(null);
  const [agentTrails, setAgentTrails] = useState<Map<string, [number, number][]>>(new Map());

  // Adjust pitch/bearing based on view mode
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
    return agents.map((a) => ({
      id: a.id,
      name: a.name,
      // Map VW coordinates to visualization using safe accessor
      position: getAgentPosition(a),
      status: (a.status as string) ?? "idle",
      color: getStatusColor(a.status as string),
      curiosity_score: safeNumber(a.metrics?.curiosity_score),
      knowledge_acquired: safeNumber(a.metrics?.knowledge_acquired),
      pulseOffset: getAgentPulseOffset(a.id), // Stable unique timing based on ID
    }));
  }, [agents]);

  // Track agent trails (last 50 positions for movement visualization)
  useEffect(() => {
    setAgentTrails((prev) => {
      const next = new Map(prev);
      agentMarkers.forEach((agent) => {
        const trail = next.get(agent.id) || [];
        const lastPos = trail[trail.length - 1];
        // Only add if position changed
        if (!lastPos || lastPos[0] !== agent.position[0] || lastPos[1] !== agent.position[1]) {
          const newTrail = [...trail, agent.position].slice(-50); // Keep last 50 positions
          next.set(agent.id, newTrail);
        }
      });
      return next;
    });
  }, [agentMarkers]);

  // Zoom controls
  const handleZoomIn = () => setViewState((s) => ({ ...s, zoom: Math.min(s.zoom + 1, 20) }));
  const handleZoomOut = () => setViewState((s) => ({ ...s, zoom: Math.max(s.zoom - 1, 1) }));
  const handleRecenter = () => {
    if (agentMarkers.length > 0) {
      const [lon, lat] = getAgentCentroid(agentMarkers);
      setViewState((s) => ({ ...s, longitude: lon, latitude: lat, zoom: Math.max(s.zoom, 8) }));
    } else {
      setViewState(INITIAL_VIEW_STATE);
    }
  };

  const getViewLabel = () => {
    switch (viewMode) {
      case "2d": return "2D Map View";
      case "2.5d": return "2.5D Perspective";
      case "3d": return "3D Globe";
    }
  };

  // Convert RGBA to Cesium Color
  const toCesiumColor = (rgba: [number, number, number, number]): Color => {
    return new Color(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3] / 255);
  };

  const ViewIcon = () => {
    switch (viewMode) {
      case "2d": return <MapIcon className="w-4 h-4" />;
      case "2.5d": return <Layers className="w-4 h-4" />;
      case "3d": return <Globe2 className="w-4 h-4" />;
    }
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
            {/* Tailwind-styled agent markers */}
            {agentMarkers.map((marker) => {
              const colorRgb = `rgb(${marker.color[0]}, ${marker.color[1]}, ${marker.color[2]})`;
              
              return (
                <Marker
                  key={marker.id}
                  longitude={marker.position[0]}
                  latitude={marker.position[1]}
                  anchor="center"
                >
                  <div className="relative w-8 h-8 flex items-center justify-center cursor-pointer"
                       onMouseEnter={() => setHoveredAgent(marker)}
                       onMouseLeave={() => setHoveredAgent(null)}>
                    {/* Outward pulsing ring */}
                    <div 
                      className="absolute w-6 h-6 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: colorRgb,
                        animationDelay: `${marker.pulseOffset}s`
                      }}
                    />
                    
                    {/* Glowing dot */}
                    <div 
                      className="relative w-2 h-2 rounded-full bg-white"
                      style={{ boxShadow: `0 0 12px 4px ${colorRgb}` }}
                    />
                  </div>
                </Marker>
              );
            })}
          </MapGL>

          {/* deck.gl overlay for agent movement trails */}
          <DeckGL
            viewState={adjustedViewState}
            controller={false}
            layers={[
              new PathLayer({
                id: "agent-trails",
                data: Array.from(agentTrails.entries())
                  .filter(([_, path]) => path.length > 1)
                  .map(([id, path]) => {
                    const marker = agentMarkers.find((a) => a.id === id);
                    return { id, path, color: marker?.color || [255, 255, 255, 255] };
                  }),
                getPath: (d: any) => d.path,
                getColor: (d: any) => [...d.color.slice(0, 3), 120] as [number, number, number, number],
                getWidth: 3,
                widthMinPixels: 2,
                widthMaxPixels: 4,
                capRounded: true,
                jointRounded: true,
              }),
            ]}
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
          onClick={handleRecenter}
          className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
      )}

      {/* Agent Count Badge - Top Left */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)]/80 backdrop-blur border border-[var(--color-border)] rounded-full">
        <Bot className="w-3.5 h-3.5 text-[var(--color-accent)]" />
        <span className="text-xs text-[var(--color-text-secondary)]">{agentMarkers.length} agents</span>
      </div>

      {/* View Mode Badge - Bottom Left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)]/80 backdrop-blur border border-[var(--color-border)] rounded-full">
        <ViewIcon />
        <span className="text-xs text-[var(--color-text-secondary)]">{getViewLabel()}</span>
      </div>

      {/* Coordinates - Bottom Right (only for 2D/2.5D) */}
      {viewMode !== "3d" && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[var(--color-bg-elevated)]/80 backdrop-blur border border-[var(--color-border)] rounded-full text-xs text-[var(--color-text-muted)] font-mono">
          {viewState.latitude.toFixed(4)}°, {viewState.longitude.toFixed(4)}° | Zoom: {viewState.zoom.toFixed(1)}
        </div>
      )}
    </div>
  );
}
