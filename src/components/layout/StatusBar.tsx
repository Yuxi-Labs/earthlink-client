/**
 * StatusBar - System status at a glance
 * 
 * Shows:
 * - Connection status
 * - Simulation state
 * - Key aggregate metrics
 * - Data freshness
 */

import {
  Wifi,
  WifiOff,
  Clock,
  Circle,
  Activity,
  AlertTriangle,
  Brain,
} from "lucide-react";
import { useMemo } from "react";
import { useAppStore } from "@/stores/appStore";
import { computeSnapshot } from "@/lib/metrics";
import { Tooltip } from "@/components/overlays/Tooltip";

export function StatusBar() {
  const {
    connectionStatus,
    agentCount,
    simulationTick,
    simulationState,
    agents,
    lastAgentUpdateMs,
  } = useAppStore();

  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  const snapshot = useMemo(() => computeSnapshot(agents, simulationTick), [agents, simulationTick]);

  const staleSeconds = useMemo(() => {
    if (!lastAgentUpdateMs) return Infinity;
    return Math.max(0, Math.round((Date.now() - lastAgentUpdateMs) / 1000));
  }, [lastAgentUpdateMs]);

  return (
    <footer className="flex items-center h-5 px-2 gap-3 bg-zinc-900 border-t border-zinc-800 text-[11px] select-none">
      {/* Connection */}
      <Tooltip content={isConnected ? "Connected to backend" : isConnecting ? "Connecting..." : "Disconnected"}>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-emerald-500" />
          ) : (
            <WifiOff className={`w-3 h-3 ${isConnecting ? "text-amber-500 animate-pulse" : "text-red-500"}`} />
          )}
        </div>
      </Tooltip>

      <div className="w-px h-3 bg-zinc-800" />

      {/* Simulation State */}
      <Tooltip content="Simulation state">
        <div className="flex items-center gap-1 text-zinc-500">
          <Activity className={`w-3 h-3 ${simulationState === "running" ? "text-emerald-500" : ""}`} />
          <span>{simulationState === "stopped" ? "Idle" : simulationState === "running" ? "Running" : "Paused"}</span>
        </div>
      </Tooltip>

      <div className="w-px h-3 bg-zinc-800" />

      {/* Tick */}
      <Tooltip content="Current simulation tick">
        <div className="flex items-center gap-1 text-zinc-500">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{simulationTick.toLocaleString()}</span>
        </div>
      </Tooltip>

      <div className="w-px h-3 bg-zinc-800" />

      {/* Total Knowledge */}
      <Tooltip content="Total knowledge items across all agents">
        <div className="flex items-center gap-1 text-zinc-500">
          <Brain className="w-3 h-3 text-violet-500" />
          <span>{snapshot.knowledgeItemsTotal.toFixed(0)}</span>
        </div>
      </Tooltip>

      {/* Errors (only show if > 0) */}
      {snapshot.errorCountTotal > 0 && (
        <>
          <div className="w-px h-3 bg-zinc-800" />
          <Tooltip content="System errors">
            <div className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="w-3 h-3" />
              <span>{snapshot.errorCountTotal}</span>
            </div>
          </Tooltip>
        </>
      )}

      <div className="flex-1" />

      {/* Staleness */}
      {staleSeconds > 10 && (
        <Tooltip content="Time since last data update">
          <div className="flex items-center gap-1 text-amber-500">
            <AlertTriangle className="w-3 h-3" />
            <span>{staleSeconds}s ago</span>
          </div>
        </Tooltip>
      )}

      {/* Agent Count */}
      <Tooltip content="Active agents">
        <div className="flex items-center gap-1 text-zinc-500">
          <Circle className="w-3 h-3" />
          <span>{agentCount}</span>
        </div>
      </Tooltip>

      <span className="text-zinc-700">v0.1</span>
    </footer>
  );
}
