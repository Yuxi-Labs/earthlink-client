/**
 * Comparison Window
 * 
 * Side-by-side agent comparison:
 * - Select 2-5 agents to compare
 * - Synchronized metric charts
 * - Behavioral differences
 * - Statistical comparisons
 */

import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  GitCompare,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import "@/App.css";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function getMetric(agent: Agent, key: string, fallback: number = 0): number {
  const val = agent.metrics?.[key];
  return typeof val === "number" ? val : fallback;
}

interface ComparisonWindowProps {
  initialAgentIds?: string[];
}

export function ComparisonWindow({ initialAgentIds }: ComparisonWindowProps) {
  const { agents } = useAppStore();
  const { fetchAgents } = useDataFetch();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialAgentIds || []);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const selectedAgents = useMemo(() => {
    return selectedIds.map(id => agents.find(a => a.id === id)).filter((a): a is Agent => !!a);
  }, [selectedIds, agents]);

  const addAgent = (id: string) => {
    if (selectedIds.length < 5 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
    setShowSelector(false);
  };

  const removeAgent = (id: string) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  // Generate comparison data for charts
  const comparisonData = useMemo(() => {
    if (selectedAgents.length === 0) return [];
    
    // Create mock time-series data for comparison
    return Array.from({ length: 50 }, (_, i) => {
      const point: Record<string, number> = { tick: i * 100 };
      selectedAgents.forEach((agent, idx) => {
        const base = getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired"));
        point[agent.id] = base * (0.5 + i / 50) + Math.sin(i * 0.2 + idx) * 5;
      });
      return point;
    });
  }, [selectedAgents]);

  // Radar chart data
  const radarData = useMemo(() => {
    const metrics = [
      { key: "knowledge", label: "Knowledge", max: 100 },
      { key: "curiosity", label: "Curiosity", max: 1 },
      { key: "distance", label: "Distance", max: 1000 },
      { key: "goals", label: "Goals", max: 10 },
      { key: "steps", label: "Steps", max: 1000 },
    ];

    return metrics.map(m => {
      const point: Record<string, number | string> = { metric: m.label };
      selectedAgents.forEach(agent => {
        let val = 0;
        if (m.key === "knowledge") val = getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired"));
        else if (m.key === "curiosity") val = getMetric(agent, "curiosity_score") * 100;
        else if (m.key === "distance") val = getMetric(agent, "distance_traveled_km") / 10;
        else if (m.key === "goals") val = getMetric(agent, "goals_achieved") * 10;
        else if (m.key === "steps") val = getMetric(agent, "total_steps_executed") / 10;
        point[agent.name] = Math.min(100, val);
      });
      return point;
    });
  }, [selectedAgents]);

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-semibold">Agent Comparison</h1>
          </div>
          <button
            onClick={() => fetchAgents()}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Agent Selection Bar */}
      <div className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedAgents.map((agent, idx) => (
            <div
              key={agent.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-sm text-zinc-300">{agent.name}</span>
              <button
                onClick={() => removeAgent(agent.id)}
                className="p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedIds.length < 5 && (
            <div className="relative">
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-zinc-700 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Agent
              </button>

              {showSelector && (
                <div className="absolute top-full left-0 mt-1 w-56 max-h-64 overflow-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10">
                  {agents.filter(a => !selectedIds.includes(a.id)).map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => addAgent(agent.id)}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      {agent.name}
                    </button>
                  ))}
                  {agents.filter(a => !selectedIds.includes(a.id)).length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-600">No more agents</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {selectedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <GitCompare className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500 mb-2">Select agents to compare</p>
            <p className="text-xs text-zinc-600">Add up to 5 agents for side-by-side analysis</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-5 gap-3">
              {selectedAgents.map((agent, idx) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-lg bg-zinc-900 border-2"
                  style={{ borderColor: COLORS[idx % COLORS.length] + "40" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-zinc-300 truncate">{agent.name}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <MetricRow label="Knowledge" value={getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired")).toFixed(0)} />
                    <MetricRow label="Distance" value={`${getMetric(agent, "distance_traveled_km").toFixed(0)} km`} />
                    <MetricRow label="Curiosity" value={`${(getMetric(agent, "curiosity_score") * 100).toFixed(0)}%`} />
                    <MetricRow label="Goals" value={getMetric(agent, "goals_achieved").toFixed(0)} />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              {/* Knowledge Over Time */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Knowledge Acquisition Comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                    <Legend />
                    {selectedAgents.map((agent, idx) => (
                      <Line
                        key={agent.id}
                        type="monotone"
                        dataKey={agent.id}
                        name={agent.name}
                        stroke={COLORS[idx % COLORS.length]}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Capability Profile</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#71717a", fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fill: "#71717a", fontSize: 8 }} />
                    {selectedAgents.map((agent, idx) => (
                      <Radar
                        key={agent.id}
                        name={agent.name}
                        dataKey={agent.name}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Detailed Metrics</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 text-zinc-500 font-medium">Metric</th>
                    {selectedAgents.map((agent, idx) => (
                      <th key={agent.id} className="text-right py-2 font-medium" style={{ color: COLORS[idx % COLORS.length] }}>
                        {agent.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  <ComparisonRow label="Knowledge Items" agents={selectedAgents} getter={a => getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired"))} />
                  <ComparisonRow label="Distance (km)" agents={selectedAgents} getter={a => getMetric(a, "distance_traveled_km")} decimals={1} />
                  <ComparisonRow label="Curiosity Score" agents={selectedAgents} getter={a => getMetric(a, "curiosity_score")} decimals={2} />
                  <ComparisonRow label="Learning Rate" agents={selectedAgents} getter={a => getMetric(a, "learning_rate")} decimals={3} />
                  <ComparisonRow label="Goals Achieved" agents={selectedAgents} getter={a => getMetric(a, "goals_achieved")} />
                  <ComparisonRow label="Goals Active" agents={selectedAgents} getter={a => getMetric(a, "goals_active")} />
                  <ComparisonRow label="Steps Executed" agents={selectedAgents} getter={a => getMetric(a, "total_steps_executed")} />
                  <ComparisonRow label="Time Alive (hrs)" agents={selectedAgents} getter={a => getMetric(a, "time_alive_hours")} decimals={1} />
                  <ComparisonRow label="Messages Sent" agents={selectedAgents} getter={a => getMetric(a, "messages_sent")} />
                  <ComparisonRow label="Error Count" agents={selectedAgents} getter={a => getMetric(a, "error_count")} />
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  );
}

function ComparisonRow({ label, agents, getter, decimals = 0 }: {
  label: string;
  agents: Agent[];
  getter: (a: Agent) => number;
  decimals?: number;
}) {
  const values = agents.map(getter);
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <tr className="border-b border-zinc-800/50">
      <td className="py-2 text-zinc-500">{label}</td>
      {agents.map((agent) => {
        const val = getter(agent);
        const isMax = val === max && max !== min;
        const isMin = val === min && max !== min;
        return (
          <td
            key={agent.id}
            className={`text-right py-2 ${isMax ? "text-emerald-400 font-medium" : isMin ? "text-red-400" : ""}`}
          >
            {val.toFixed(decimals)}
          </td>
        );
      })}
    </tr>
  );
}

