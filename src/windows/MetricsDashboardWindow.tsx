/**
 * Metrics Dashboard Window
 * 
 * System-wide analytics for researchers:
 * - Aggregate metrics across all agents
 * - Knowledge acquisition trends
 * - Exploration coverage
 * - Error rates and system health
 * - Comparative charts
 */

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Brain,
  Route,
  Target,
  Users,
  AlertTriangle,
  Compass,
  RefreshCw,
  Download,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import "@/App.css";

function getMetric(agent: { metrics?: Record<string, unknown> }, key: string, fallback: number = 0): number {
  const val = agent.metrics?.[key];
  return typeof val === "number" ? val : fallback;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function MetricsDashboardWindow() {
  const { agents, simulationTick, simulationState } = useAppStore();
  const { fetchAgents } = useDataFetch();
  const [historyData, setHistoryData] = useState<Array<{
    tick: number;
    totalKnowledge: number;
    totalDistance: number;
    avgCuriosity: number;
    activeAgents: number;
    errors: number;
  }>>([]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Accumulate history
  useEffect(() => {
    if (agents.length === 0) return;

    const totalKnowledge = agents.reduce((sum, a) => sum + getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired")), 0);
    const totalDistance = agents.reduce((sum, a) => sum + getMetric(a, "distance_traveled_km"), 0);
    const avgCuriosity = agents.reduce((sum, a) => sum + getMetric(a, "curiosity_score"), 0) / agents.length;
    const errors = agents.reduce((sum, a) => sum + getMetric(a, "error_count"), 0);

    setHistoryData(prev => {
      const newPoint = {
        tick: simulationTick,
        totalKnowledge,
        totalDistance,
        avgCuriosity: avgCuriosity * 100,
        activeAgents: agents.filter(a => a.status !== "retired" && a.status !== "corrupted").length,
        errors,
      };
      return [...prev, newPoint].slice(-200);
    });
  }, [agents, simulationTick]);

  // Compute aggregate metrics
  const aggregates = useMemo(() => {
    const totalKnowledge = agents.reduce((sum, a) => sum + getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired")), 0);
    const totalDistance = agents.reduce((sum, a) => sum + getMetric(a, "distance_traveled_km"), 0);
    const avgCuriosity = agents.length > 0 
      ? agents.reduce((sum, a) => sum + getMetric(a, "curiosity_score"), 0) / agents.length 
      : 0;
    const totalGoals = agents.reduce((sum, a) => sum + getMetric(a, "goals_achieved"), 0);
    const totalErrors = agents.reduce((sum, a) => sum + getMetric(a, "error_count"), 0);
    const totalSteps = agents.reduce((sum, a) => sum + getMetric(a, "total_steps_executed"), 0);

    return { totalKnowledge, totalDistance, avgCuriosity, totalGoals, totalErrors, totalSteps };
  }, [agents]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    agents.forEach(a => {
      const status = a.status || "unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [agents]);

  // Top performers
  const topByKnowledge = useMemo(() => {
    return [...agents]
      .sort((a, b) => getMetric(b, "knowledge_items_learned") - getMetric(a, "knowledge_items_learned"))
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        knowledge: getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired")),
      }));
  }, [agents]);

  const topByDistance = useMemo(() => {
    return [...agents]
      .sort((a, b) => getMetric(b, "distance_traveled_km") - getMetric(a, "distance_traveled_km"))
      .slice(0, 5)
      .map(a => ({
        name: a.name,
        distance: getMetric(a, "distance_traveled_km"),
      }));
  }, [agents]);

  const handleExportCSV = () => {
    const headers = ["Agent ID", "Name", "Status", "Knowledge", "Distance (km)", "Curiosity", "Goals", "Steps", "Errors"];
    const rows = agents.map(a => [
      a.id,
      a.name,
      a.status || "unknown",
      getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired")).toFixed(0),
      getMetric(a, "distance_traveled_km").toFixed(1),
      (getMetric(a, "curiosity_score") * 100).toFixed(0),
      getMetric(a, "goals_achieved").toFixed(0),
      getMetric(a, "total_steps_executed").toFixed(0),
      getMetric(a, "error_count").toFixed(0),
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `earthlink-metrics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Metrics Dashboard</h1>
            <p className="text-xs text-zinc-500">System-wide analytics • {agents.length} agents</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              Tick {simulationTick.toLocaleString()} •{" "}
              {simulationState === "running" ? (
                <span className="text-emerald-400">Running</span>
              ) : (
                <span className="text-zinc-400">Paused</span>
              )}
            </span>
            <button
              onClick={() => fetchAgents()}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Top Metrics */}
        <div className="grid grid-cols-6 gap-3">
          <MetricCard icon={Users} label="Agents" value={agents.length.toString()} color="blue" />
          <MetricCard icon={Brain} label="Total Knowledge" value={aggregates.totalKnowledge.toFixed(0)} color="violet" />
          <MetricCard icon={Route} label="Total Distance" value={`${aggregates.totalDistance.toFixed(0)} km`} color="emerald" />
          <MetricCard icon={Target} label="Goals Achieved" value={aggregates.totalGoals.toFixed(0)} color="amber" />
          <MetricCard icon={Compass} label="Avg Curiosity" value={`${(aggregates.avgCuriosity * 100).toFixed(0)}%`} color="cyan" />
          <MetricCard icon={AlertTriangle} label="Errors" value={aggregates.totalErrors.toFixed(0)} color={aggregates.totalErrors > 0 ? "red" : "zinc"} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Knowledge Over Time */}
          <div className="col-span-2 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Knowledge Acquisition Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                <Area type="monotone" dataKey="totalKnowledge" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Total Knowledge" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Agent Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Curiosity & Activity */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Curiosity & Active Agents</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgCuriosity" stroke="#f59e0b" dot={false} name="Avg Curiosity %" />
                <Line yAxisId="right" type="monotone" dataKey="activeAgents" stroke="#10b981" dot={false} name="Active Agents" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distance Over Time */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Total Distance Traveled</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                <Area type="monotone" dataKey="totalDistance" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Distance (km)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Top Agents by Knowledge</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topByKnowledge} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#71717a", fontSize: 10 }} width={60} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                <Bar dataKey="knowledge" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Top Agents by Distance</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topByDistance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#71717a", fontSize: 10 }} width={60} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} />
                <Bar dataKey="distance" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
    red: "from-red-500/20 to-red-500/5 text-red-400",
    zinc: "from-zinc-500/20 to-zinc-500/5 text-zinc-400",
  };

  return (
    <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} border border-zinc-800`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-xl font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

