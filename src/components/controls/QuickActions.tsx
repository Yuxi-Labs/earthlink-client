/**
 * QuickActions - Floating quick action toolbar
 */

import { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Download,
  Grid3X3,
  MapPin,
  Route,
  MessageCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";

interface QuickActionsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onScreenshot?: () => void;
  onExport?: () => void;
  toggles?: {
    trails?: boolean;
    labels?: boolean;
    grid?: boolean;
    signals?: boolean;
    heatmap?: boolean;
  };
  onToggle?: (key: string) => void;
}

export function QuickActions({
  isRunning,
  onPlayPause,
  onReset,
  onScreenshot,
  onExport,
  toggles = {},
  onToggle,
}: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-xl overflow-hidden">
      {/* Main play/pause */}
      <div className="p-2 border-b border-zinc-800">
        <button
          onClick={onPlayPause}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
            isRunning 
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" 
              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          }`}
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span className="text-sm font-medium">{isRunning ? "Pause" : "Play"}</span>
        </button>
      </div>

      {/* Toggle expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center py-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
      >
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <>
          {/* Quick actions grid */}
          <div className="p-2 grid grid-cols-3 gap-1">
            <ActionButton icon={RotateCcw} label="Reset" onClick={onReset} />
            <ActionButton icon={Camera} label="Screenshot" onClick={onScreenshot} />
            <ActionButton icon={Download} label="Export" onClick={onExport} />
          </div>

          {/* Layer toggles */}
          <div className="px-2 pb-2 border-t border-zinc-800 pt-2">
            <p className="text-[10px] text-zinc-500 mb-1.5 px-1">Overlays</p>
            <div className="grid grid-cols-2 gap-1">
              <ToggleButton
                icon={Route}
                label="Trails"
                active={toggles.trails}
                onClick={() => onToggle?.("trails")}
              />
              <ToggleButton
                icon={MapPin}
                label="Labels"
                active={toggles.labels}
                onClick={() => onToggle?.("labels")}
              />
              <ToggleButton
                icon={Grid3X3}
                label="Grid"
                active={toggles.grid}
                onClick={() => onToggle?.("grid")}
              />
              <ToggleButton
                icon={MessageCircle}
                label="Signals"
                active={toggles.signals}
                onClick={() => onToggle?.("signals")}
              />
              <ToggleButton
                icon={Sparkles}
                label="Heatmap"
                active={toggles.heatmap}
                onClick={() => onToggle?.("heatmap")}
                className="col-span-2"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ActionButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

function ToggleButton({ 
  icon: Icon, 
  label, 
  active, 
  onClick,
  className = "",
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${className} ${
        active 
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
      }`}
    >
      <Icon className="w-3 h-3" />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

/**
 * Speed control dial
 */
interface SpeedDialProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export function SpeedDial({ speed, onSpeedChange }: SpeedDialProps) {
  const presets = [0.1, 0.5, 1, 2, 5, 10];

  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-xl p-2 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => onSpeedChange(Math.max(0.1, speed - 0.1))}
          className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          <Minus className="w-3 h-3 text-zinc-400" />
        </button>
        
        <div className="flex-1 text-center">
          <span className="text-lg font-bold text-zinc-200">{speed.toFixed(1)}</span>
          <span className="text-xs text-zinc-500">x</span>
        </div>
        
        <button
          onClick={() => onSpeedChange(Math.min(20, speed + 0.1))}
          className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
        >
          <Plus className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
      
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onSpeedChange(p)}
            className={`flex-1 py-1 rounded text-[10px] transition-colors ${
              Math.abs(speed - p) < 0.05
                ? "bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {p}x
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Agent spawn button with options
 */
interface SpawnButtonProps {
  onSpawn: (count: number) => void;
}

export function SpawnButton({ onSpawn }: SpawnButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => onSpawn(1)}
        onContextMenu={(e) => { e.preventDefault(); setShowOptions(!showOptions); }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl shadow-lg transition-all hover:scale-105"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Spawn Agent</span>
      </button>

      {showOptions && (
        <div className="absolute top-full mt-1 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10">
          {[1, 5, 10, 25].map((n) => (
            <button
              key={n}
              onClick={() => { onSpawn(n); setShowOptions(false); }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Spawn {n} agent{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

