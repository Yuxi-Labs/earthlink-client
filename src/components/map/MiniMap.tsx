/**
 * MiniMap - Picture-in-picture overview map
 */

import { useState } from "react";
import { Maximize2, Minimize2, Map, Satellite, Layers } from "lucide-react";

interface MiniMapProps {
  mainViewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  agents?: Array<{ id: string; lat: number; lon: number; color: string }>;
  onViewportClick?: (lat: number, lon: number) => void;
}

export function MiniMap({ mainViewport, agents = [], onViewportClick }: MiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "terrain">("dark");

  // Convert lat/lon to minimap coordinates (simplified Australia bounds)
  const toMiniCoords = (lat: number, lon: number) => {
    const minLat = -45, maxLat = -10;
    const minLon = 110, maxLon = 155;
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const viewportCoords = toMiniCoords(mainViewport.latitude, mainViewport.longitude);
  const viewportSize = Math.max(5, 30 / mainViewport.zoom);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onViewportClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const lat = -10 - y * 35;
    const lon = 110 + x * 45;
    onViewportClick(lat, lon);
  };

  const size = isExpanded ? 200 : 120;

  return (
    <div
      className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-lg overflow-hidden shadow-xl transition-all duration-200"
      style={{ width: size, height: size }}
    >
      {/* Map area */}
      <div
        className="relative w-full h-full cursor-crosshair"
        style={{
          background: mapStyle === "dark" 
            ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
            : mapStyle === "satellite"
            ? "linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)"
            : "linear-gradient(135deg, #2d3436 0%, #636e72 100%)",
        }}
        onClick={handleClick}
      >
        {/* Australia outline (simplified) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M25,30 Q30,25 40,28 L55,25 Q65,30 75,35 L80,45 Q82,55 78,65 L70,75 Q60,80 50,78 L35,75 Q25,70 22,60 L20,45 Q22,35 25,30 Z"
            fill="rgba(255,255,255,0.1)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
        </svg>

        {/* Agent dots */}
        {agents.map((agent) => {
          const pos = toMiniCoords(agent.lat, agent.lon);
          return (
            <div
              key={agent.id}
              className="absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                backgroundColor: agent.color,
                boxShadow: `0 0 4px ${agent.color}`,
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-cyan-400/70 bg-cyan-400/10 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${viewportCoords.x}%`,
            top: `${viewportCoords.y}%`,
            width: `${viewportSize}%`,
            height: `${viewportSize}%`,
          }}
        />

        {/* Controls overlay */}
        <div className="absolute top-1 right-1 flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-1 bg-zinc-800/80 rounded hover:bg-zinc-700 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3 text-zinc-400" /> : <Maximize2 className="w-3 h-3 text-zinc-400" />}
          </button>
        </div>

        {/* Map style toggle */}
        <div className="absolute bottom-1 left-1 flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setMapStyle("dark"); }}
            className={`p-1 rounded transition-colors ${mapStyle === "dark" ? "bg-blue-500/50" : "bg-zinc-800/80 hover:bg-zinc-700"}`}
          >
            <Map className="w-2.5 h-2.5 text-zinc-300" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMapStyle("satellite"); }}
            className={`p-1 rounded transition-colors ${mapStyle === "satellite" ? "bg-blue-500/50" : "bg-zinc-800/80 hover:bg-zinc-700"}`}
          >
            <Satellite className="w-2.5 h-2.5 text-zinc-300" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMapStyle("terrain"); }}
            className={`p-1 rounded transition-colors ${mapStyle === "terrain" ? "bg-blue-500/50" : "bg-zinc-800/80 hover:bg-zinc-700"}`}
          >
            <Layers className="w-2.5 h-2.5 text-zinc-300" />
          </button>
        </div>

        {/* Coordinates */}
        <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-zinc-900/80 rounded text-[8px] font-mono text-zinc-400">
          {mainViewport.latitude.toFixed(1)}°, {mainViewport.longitude.toFixed(1)}°
        </div>
      </div>
    </div>
  );
}

