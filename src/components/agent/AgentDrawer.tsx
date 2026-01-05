import { useState, useMemo } from "react";
import { useAppStore } from "@/stores/appStore";
import { X, Activity, Brain, Zap, Route, TrendingUp, Settings2, Sliders } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function ParameterSlider({ label, value, min, max, step = 0.1, unit = "", disabled, onChange }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <span className="text-[11px] font-mono text-zinc-400">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

interface MiniChartProps {
  data: { tick: number; value: number }[];
  color: string;
  height?: number;
}

function MiniChart({ data, color, height = 40 }: MiniChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#grad-${color})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgentDrawer() {
  const { selectedAgentId, agents, setSelectedAgentId } = useAppStore();
  const [activeTab, setActiveTab] = useState<"overview" | "parameters" | "history">("overview");

  const agent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  // Mock parameter values (would come from agent in real implementation)
  const [curiosityWeight, setCuriosityWeight] = useState(0.5);
  const [learningRate, setLearningRate] = useState(0.01);
  const [explorationBias, setExplorationBias] = useState(0.3);
  const [rewardDiscount, setRewardDiscount] = useState(0.99);

  // Mock history data
  const mockHistory = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      tick: i,
      reward: Math.sin(i * 0.2) * 0.3 + 0.5 + Math.random() * 0.1,
      knowledge: i * 2 + Math.random() * 5,
      curiosity: Math.cos(i * 0.15) * 0.2 + 0.6,
    }));
  }, []);

  if (!selectedAgentId || !agent) {
    return null;
  }

  const statusColor = {
    idle: "#71717a",
    exploring: "#3b82f6",
    learning: "#f59e0b",
    interacting: "#06b6d4",
    executing: "#22c55e",
    adapting: "#8b5cf6",
    overloaded: "#ef4444",
    corrupted: "#dc2626",
    retired: "#52525b",
  }[agent.status as string] || "#71717a";

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <div>
            <h3 className="text-sm font-medium text-zinc-200">{agent.name}</h3>
            <p className="text-[10px] text-zinc-500 font-mono">{agent.id}</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedAgentId(null)}
          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(["overview", "parameters", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "text-zinc-200 border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "overview" && (
          <>
            {/* Status */}
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-zinc-400">Current Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span className="text-sm font-medium text-zinc-200 capitalize">
                  {agent.status}
                </span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[10px] text-zinc-500">Knowledge</span>
                </div>
                <span className="text-lg font-semibold text-zinc-200">
                  {(agent.metrics?.knowledge_acquired ?? agent.metrics?.knowledge_items_learned ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] text-zinc-500">Reward</span>
                </div>
                <span className="text-lg font-semibold text-zinc-200">
                  {(Number(agent.metrics?.total_reward) || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Route className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] text-zinc-500">Distance</span>
                </div>
                <span className="text-lg font-semibold text-zinc-200">
                  {(Number(agent.metrics?.distance_traveled_km) || 0).toFixed(1)} km
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-[10px] text-zinc-500">Curiosity</span>
                </div>
                <span className="text-lg font-semibold text-zinc-200">
                  {(Number(agent.metrics?.curiosity_score) || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Mini reward chart */}
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-zinc-400">Reward History</span>
              </div>
              <MiniChart
                data={mockHistory.map((h) => ({ tick: h.tick, value: h.reward }))}
                color="#f59e0b"
                height={60}
              />
            </div>
          </>
        )}

        {activeTab === "parameters" && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-400">Agent Parameters</span>
            </div>
            <p className="text-[10px] text-zinc-600 mb-4">
              Adjust parameters to modify agent behavior. Changes take effect on next tick.
            </p>

            <div className="space-y-4">
              <ParameterSlider
                label="Curiosity Weight"
                value={curiosityWeight}
                min={0}
                max={1}
                onChange={setCuriosityWeight}
                disabled
              />
              <ParameterSlider
                label="Learning Rate"
                value={learningRate}
                min={0.001}
                max={0.1}
                step={0.001}
                onChange={setLearningRate}
                disabled
              />
              <ParameterSlider
                label="Exploration Bias"
                value={explorationBias}
                min={0}
                max={1}
                onChange={setExplorationBias}
                disabled
              />
              <ParameterSlider
                label="Reward Discount (γ)"
                value={rewardDiscount}
                min={0.9}
                max={1}
                step={0.01}
                onChange={setRewardDiscount}
                disabled
              />
            </div>

            <div className="mt-4 p-3 rounded-lg border border-dashed border-zinc-700 text-center">
              <Settings2 className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-500">
                Parameter modification requires backend integration
              </p>
            </div>
          </>
        )}

        {activeTab === "history" && (
          <>
            <div className="space-y-4">
              {/* Knowledge over time */}
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs text-zinc-400">Knowledge</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {mockHistory[mockHistory.length - 1]?.knowledge.toFixed(0)} total
                  </span>
                </div>
                <MiniChart
                  data={mockHistory.map((h) => ({ tick: h.tick, value: h.knowledge }))}
                  color="#06b6d4"
                  height={50}
                />
              </div>

              {/* Curiosity over time */}
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-500" />
                    <span className="text-xs text-zinc-400">Curiosity</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {mockHistory[mockHistory.length - 1]?.curiosity.toFixed(2)}
                  </span>
                </div>
                <MiniChart
                  data={mockHistory.map((h) => ({ tick: h.tick, value: h.curiosity }))}
                  color="#8b5cf6"
                  height={50}
                />
              </div>

              {/* Recent actions */}
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-400">Recent Actions</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="w-12 font-mono text-zinc-600">T-0</span>
                    <span className="text-zinc-400">explore</span>
                    <span className="text-zinc-600">→ sector_42</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="w-12 font-mono text-zinc-600">T-1</span>
                    <span className="text-zinc-400">learn</span>
                    <span className="text-zinc-600">→ data_pattern</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="w-12 font-mono text-zinc-600">T-2</span>
                    <span className="text-zinc-400">interact</span>
                    <span className="text-zinc-600">→ agent_07</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

