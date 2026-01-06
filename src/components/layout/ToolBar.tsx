/**
 * ToolBar - Minimal simulation controls
 * 
 * Only essential quick-access actions:
 * - Play/Pause (simulation control)
 * - Speed indicator (Rewind/FastForward adjust speed)
 * - View mode toggle (2D/2.5D/3D)
 * 
 * Everything else belongs in menus or dedicated panels.
 */

import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Map,
  Layers,
  Globe2,
  Sparkles,
  Radio,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { Tooltip } from "@/components/overlays/Tooltip";
import { useSimulation } from "@/hooks/useWebSocket";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function ToolButton({ icon, label, shortcut, active, onClick, disabled }: ToolButtonProps) {
  const tooltipText = shortcut ? `${label} (${shortcut})` : label;

  return (
    <Tooltip content={tooltipText} position="bottom">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          flex items-center justify-center w-7 h-7 rounded transition-colors
          ${disabled
            ? "text-zinc-700 opacity-50"
            : active
              ? "bg-zinc-800 text-zinc-200"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          }
        `}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-zinc-800 mx-1.5" />;
}

export function ToolBar() {
  const {
    viewMode,
    setViewMode,
    simulationState,
    simulationSpeed,
    setSimulationSpeed,
    showCoverageOverlay,
    showSignalOverlay,
    toggleCoverageOverlay,
    toggleSignalOverlay,
  } = useAppStore();

  const { start, pause } = useSimulation();
  const isRunning = simulationState === "running";

  const handleSlowDown = () => {
    setSimulationSpeed(Math.max(0.1, simulationSpeed / 2));
  };

  const handleSpeedUp = () => {
    setSimulationSpeed(Math.min(10, simulationSpeed * 2));
  };

  return (
    <div className="flex items-center h-8 px-2 gap-1 bg-zinc-900 border-b border-zinc-800">
      {/* Simulation Controls */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={<Play className="w-3.5 h-3.5" />}
          label="Start"
          shortcut="F5"
          onClick={start}
          disabled={isRunning}
        />
        <ToolButton
          icon={<Pause className="w-3.5 h-3.5" />}
          label="Pause"
          shortcut="F6"
          onClick={pause}
          disabled={!isRunning}
        />
      </div>

      <Divider />

      {/* Speed Controls */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={<Rewind className="w-3.5 h-3.5" />}
          label="Slow down"
          shortcut=","
          onClick={handleSlowDown}
        />
        <Tooltip content="Simulation speed" position="bottom">
          <span className="text-[10px] font-mono text-zinc-500 px-1.5 min-w-[36px] text-center select-none">
            {simulationSpeed.toFixed(1)}×
          </span>
        </Tooltip>
        <ToolButton
          icon={<FastForward className="w-3.5 h-3.5" />}
          label="Speed up"
          shortcut="."
          onClick={handleSpeedUp}
        />
      </div>

      <Divider />

      {/* View Mode */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={<Map className="w-3.5 h-3.5" />}
          label="2D Map"
          shortcut="1"
          active={viewMode === "2d"}
          onClick={() => setViewMode("2d")}
        />
        <ToolButton
          icon={<Layers className="w-3.5 h-3.5" />}
          label="2.5D View"
          shortcut="2"
          active={viewMode === "2.5d"}
          onClick={() => setViewMode("2.5d")}
        />
        <ToolButton
          icon={<Globe2 className="w-3.5 h-3.5" />}
          label="3D Globe"
          shortcut="3"
          active={viewMode === "3d"}
          onClick={() => setViewMode("3d")}
        />
      </div>

      <Divider />

      {/* Visual Data Analysis Layers */}
      <div className="flex items-center gap-0.5">
        <ToolButton
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Exploration Analysis"
          shortcut="H"
          active={showCoverageOverlay}
          onClick={toggleCoverageOverlay}
        />
        <ToolButton
          icon={<Radio className="w-3.5 h-3.5" />}
          label="Learning Analytics"
          shortcut="S"
          active={showSignalOverlay}
          onClick={toggleSignalOverlay}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicator - simulation state */}
      <div className="flex items-center gap-1.5 text-xs">
        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500" : "bg-zinc-600"}`} />
        <span className="text-zinc-500">
          {simulationState === "stopped" ? "Idle" : simulationState === "running" ? "Running" : "Paused"}
        </span>
      </div>
    </div>
  );
}
