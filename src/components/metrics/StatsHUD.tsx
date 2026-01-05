/**
 * StatsHUD - Heads-up display overlay for quick stats
 */

import { 
  Brain,
  Zap,
  Route,
  Clock,
  Wifi,
  WifiOff,
  Circle,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { MetricsDial } from "./MetricsDial";

export function StatsHUD() {
  const { 
    agents, 
    connectionStatus, 
    simulationState, 
    simulationTick, 
    simulationSpeed 
  } = useAppStore();

  // Aggregate metrics
  const totalKnowledge = agents.reduce((sum, a) => 
    sum + Number(a.metrics?.knowledge_items_learned || 0), 0);
  const totalDistance = agents.reduce((sum, a) => 
    sum + Number(a.metrics?.distance_traveled_km || 0), 0);
  const avgCuriosity = agents.length > 0
    ? agents.reduce((sum, a) => sum + Number(a.metrics?.curiosity_score || 0.5), 0) / agents.length
    : 0;
  const totalReward = agents.reduce((sum, a) => 
    sum + Number(a.metrics?.total_reward || 0), 0);

  const isConnected = connectionStatus === "connected";
  const isRunning = simulationState === "running";

  return (
    <div className="flex items-start gap-2">
      {/* Connection & Sim Status */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Connection */}
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            )}
            <span className={`text-[10px] ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>

          <div className="w-px h-4 bg-zinc-700" />

          {/* Simulation state */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-green-500 animate-pulse" : 
              simulationState === "paused" ? "bg-amber-500" : "bg-zinc-500"
            }`} />
            <span className="text-[10px] text-zinc-400 capitalize">
              {simulationState === "stopped" ? "Idle" : simulationState}
            </span>
          </div>

          <div className="w-px h-4 bg-zinc-700" />

          {/* Tick & Speed */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-300">{simulationTick}</span>
            <span className="text-[10px] text-zinc-500">@ {simulationSpeed}x</span>
          </div>

          <div className="w-px h-4 bg-zinc-700" />

          {/* Agent count */}
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-zinc-300">{agents.length}</span>
            <span className="text-[10px] text-zinc-500">agents</span>
          </div>
        </div>
      </div>

      {/* Quick Stats with mini dials */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10">
              <MetricsDial 
                value={avgCuriosity * 100} 
                max={100} 
                label="" 
                size="sm"
                color="#f59e0b"
                showTicks={false}
              />
            </div>
            <div className="text-[10px]">
              <p className="text-zinc-500">Curiosity</p>
              <p className="text-amber-400 font-mono">{(avgCuriosity * 100).toFixed(0)}%</p>
            </div>
          </div>

          <div className="w-px h-8 bg-zinc-700" />

          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <div className="text-[10px]">
              <p className="text-zinc-500">Knowledge</p>
              <p className="text-blue-400 font-mono">{totalKnowledge}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-zinc-700" />

          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-green-400" />
            <div className="text-[10px]">
              <p className="text-zinc-500">Distance</p>
              <p className="text-green-400 font-mono">{totalDistance.toFixed(0)} km</p>
            </div>
          </div>

          <div className="w-px h-8 bg-zinc-700" />

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <div className="text-[10px]">
              <p className="text-zinc-500">Reward</p>
              <p className="text-violet-400 font-mono">{totalReward.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact floating metrics badges
 */
export function MetricBadge({ 
  icon: Icon, 
  value, 
  label, 
  color = "#3b82f6" 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-full shadow-lg">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-[10px] font-mono text-zinc-200">{value}</span>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}

