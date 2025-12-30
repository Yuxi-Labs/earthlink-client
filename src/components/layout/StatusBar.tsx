import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Users, 
  Activity,
  Gauge
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export function StatusBar() {
  const { 
    connectionStatus, 
    agentCount, 
    simulationTick, 
    simulationSpeed,
    simulationState 
  } = useAppStore();

  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  const getConnectionColor = () => {
    if (isConnected) return "text-[var(--color-success)]";
    if (isConnecting) return "text-[var(--color-warning)]";
    return "text-[var(--color-error)]";
  };

  const getConnectionText = () => {
    if (isConnected) return "Connected";
    if (isConnecting) return "Connecting...";
    return "Disconnected";
  };

  return (
    <footer className="flex items-center h-6 px-2 gap-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] text-xs select-none">
      {/* Connection Status */}
      <div className={`flex items-center gap-1.5 ${getConnectionColor()}`}>
        {isConnected ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className={`w-3 h-3 ${isConnecting ? "animate-pulse" : ""}`} />
        )}
        <span>{getConnectionText()}</span>
      </div>

      <div className="w-px h-3 bg-[var(--color-border)]" />

      {/* Simulation State */}
      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        <Activity className={`w-3 h-3 ${simulationState === "running" ? "text-[var(--color-success)] animate-pulse" : ""}`} />
        <span className="capitalize">{simulationState}</span>
      </div>

      <div className="w-px h-3 bg-[var(--color-border)]" />

      {/* Simulation Speed */}
      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        <Gauge className="w-3 h-3" />
        <span>{simulationSpeed}x</span>
      </div>

      <div className="w-px h-3 bg-[var(--color-border)]" />

      {/* Tick Count */}
      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        <Clock className="w-3 h-3" />
        <span>Tick: {simulationTick.toLocaleString()}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Agent Count */}
      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        <Users className="w-3 h-3" />
        <span>{agentCount} Agents</span>
      </div>

      {/* Version */}
      <div className="text-[var(--color-text-muted)]">
        v0.0.1
      </div>
    </footer>
  );
}
