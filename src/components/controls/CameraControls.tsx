/**
 * CameraControls - View perspective and camera angle controls
 */

import { useState } from "react";
import { 
  Eye, 
  Globe2, 
  Mountain, 
  Navigation, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Compass,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";

export type CameraMode = "2d" | "2.5d" | "3d" | "follow";

interface CameraControlsProps {
  mode: CameraMode;
  pitch: number;
  bearing: number;
  zoom: number;
  onModeChange: (mode: CameraMode) => void;
  onPitchChange: (pitch: number) => void;
  onBearingChange: (bearing: number) => void;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  onPan: (direction: "up" | "down" | "left" | "right") => void;
}

export function CameraControls({
  mode,
  pitch,
  bearing,
  zoom,
  onModeChange,
  onPitchChange,
  onBearingChange,
  onZoomChange,
  onReset,
  onPan,
}: CameraControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const modes: { id: CameraMode; icon: React.ElementType; label: string }[] = [
    { id: "2d", icon: Eye, label: "Top Down" },
    { id: "2.5d", icon: Mountain, label: "Perspective" },
    { id: "3d", icon: Globe2, label: "Globe" },
    { id: "follow", icon: Navigation, label: "Follow Agent" },
  ];

  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-xl shadow-xl overflow-hidden">
      {/* Mode selector */}
      <div className="flex border-b border-zinc-800">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 transition-colors ${
                mode === m.id
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
              title={m.label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[8px]">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main controls */}
      <div className="p-2">
        {/* D-pad navigation */}
        <div className="flex justify-center mb-2">
          <div className="grid grid-cols-3 gap-0.5">
            <div />
            <button
              onClick={() => onPan("up")}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            </button>
            <div />
            <button
              onClick={() => onPan("left")}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-zinc-400" />
            </button>
            <button
              onClick={onReset}
              className="p-1.5 bg-zinc-800 hover:bg-blue-500/50 rounded transition-colors"
              title="Reset View"
            >
              <Home className="w-3 h-3 text-zinc-400" />
            </button>
            <button
              onClick={() => onPan("right")}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </button>
            <div />
            <button
              onClick={() => onPan("down")}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
            <div />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onZoomChange(zoom - 0.5)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            <ZoomOut className="w-3 h-3 text-zinc-400" />
          </button>
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(zoom / 20) * 100}%` }}
            />
          </div>
          <button
            onClick={() => onZoomChange(zoom + 0.5)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            <ZoomIn className="w-3 h-3 text-zinc-400" />
          </button>
          <span className="text-[10px] font-mono text-zinc-400 w-6">{zoom.toFixed(1)}</span>
        </div>

        {/* Toggle advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Move3D className="w-3 h-3" />
          {showAdvanced ? "Hide" : "Show"} Advanced
        </button>

        {/* Advanced controls */}
        {showAdvanced && (
          <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2">
            {/* Pitch control */}
            <div className="flex items-center gap-2">
              <Mountain className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-400 w-8">Pitch</span>
              <input
                type="range"
                min="0"
                max="85"
                value={pitch}
                onChange={(e) => onPitchChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-8">{pitch}°</span>
            </div>

            {/* Bearing/rotation control */}
            <div className="flex items-center gap-2">
              <Compass className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-400 w-8">Rotate</span>
              <input
                type="range"
                min="0"
                max="360"
                value={bearing}
                onChange={(e) => onBearingChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-8">{bearing}°</span>
            </div>

            {/* Reset rotation */}
            <button
              onClick={() => { onPitchChange(0); onBearingChange(0); }}
              className="w-full flex items-center justify-center gap-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Rotation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

