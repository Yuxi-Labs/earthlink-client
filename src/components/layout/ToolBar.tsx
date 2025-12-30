import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Map,
  Layers,
  Globe2,
  Users,
  BarChart3,
  Terminal,
  Settings,
  Maximize2
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function ToolButton({ icon, label, active, onClick, disabled }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        flex items-center justify-center w-8 h-8 rounded transition-colors
        ${active 
          ? "bg-[var(--color-primary)] text-white" 
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {icon}
    </button>
  );
}

function ToolDivider() {
  return <div className="w-px h-6 bg-[var(--color-border)] mx-1" />;
}

export function ToolBar() {
  const { 
    viewMode, 
    setViewMode, 
    simulationState,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    showAgentPanel,
    showMetricsPanel,
    showTerminal,
    toggleAgentPanel,
    toggleMetricsPanel,
    toggleTerminal
  } = useAppStore();

  const isRunning = simulationState === "running";

  return (
    <div className="flex items-center h-10 px-2 gap-1 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
      {/* Simulation Controls */}
      <div className="flex items-center gap-0.5">
        <ToolButton 
          icon={<Play className="w-4 h-4" />} 
          label="Start Simulation (F5)"
          onClick={startSimulation}
          disabled={isRunning}
        />
        <ToolButton 
          icon={<Pause className="w-4 h-4" />} 
          label="Pause Simulation (F6)"
          onClick={pauseSimulation}
          disabled={!isRunning}
        />
        <ToolButton 
          icon={<Square className="w-4 h-4" />} 
          label="Stop Simulation (Shift+F5)"
          onClick={stopSimulation}
          disabled={simulationState === "stopped"}
        />
        <ToolButton 
          icon={<RotateCcw className="w-4 h-4" />} 
          label="Reset Simulation"
          disabled={isRunning}
        />
      </div>

      <ToolDivider />

      {/* View Mode */}
      <div className="flex items-center gap-0.5">
        <ToolButton 
          icon={<Map className="w-4 h-4" />} 
          label="2D View (1)"
          active={viewMode === "2d"}
          onClick={() => setViewMode("2d")}
        />
        <ToolButton 
          icon={<Layers className="w-4 h-4" />} 
          label="2.5D View (2)"
          active={viewMode === "2.5d"}
          onClick={() => setViewMode("2.5d")}
        />
        <ToolButton 
          icon={<Globe2 className="w-4 h-4" />} 
          label="3D View (3)"
          active={viewMode === "3d"}
          onClick={() => setViewMode("3d")}
        />
      </div>

      <ToolDivider />

      {/* Panel Toggles */}
      <div className="flex items-center gap-0.5">
        <ToolButton 
          icon={<Users className="w-4 h-4" />} 
          label="Toggle Agents Panel"
          active={showAgentPanel}
          onClick={toggleAgentPanel}
        />
        <ToolButton 
          icon={<BarChart3 className="w-4 h-4" />} 
          label="Toggle Metrics Panel"
          active={showMetricsPanel}
          onClick={toggleMetricsPanel}
        />
        <ToolButton 
          icon={<Terminal className="w-4 h-4" />} 
          label="Toggle Terminal (Ctrl+`)"
          active={showTerminal}
          onClick={toggleTerminal}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side tools */}
      <div className="flex items-center gap-0.5">
        <ToolButton 
          icon={<Maximize2 className="w-4 h-4" />} 
          label="Fullscreen"
        />
        <ToolButton 
          icon={<Settings className="w-4 h-4" />} 
          label="Settings"
        />
      </div>
    </div>
  );
}
