/**
 * Data Browser Window
 * 
 * Full-featured data table for research:
 * - All agent data in tabular format
 * - Sorting, filtering, column selection
 * - Export to CSV/JSON
 * - Search functionality
 */

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Table,
  Settings,
  X,
} from "lucide-react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import "@/App.css";

type SortKey = "name" | "status" | "knowledge" | "distance" | "curiosity" | "goals" | "steps" | "errors";
type SortDir = "asc" | "desc";

function getMetric(agent: Agent, key: string, fallback: number = 0): number {
  const val = agent.metrics?.[key];
  return typeof val === "number" ? val : fallback;
}

const ALL_COLUMNS = [
  { key: "name", label: "Name", width: 120 },
  { key: "status", label: "Status", width: 100 },
  { key: "knowledge", label: "Knowledge", width: 100 },
  { key: "distance", label: "Distance (km)", width: 110 },
  { key: "curiosity", label: "Curiosity", width: 90 },
  { key: "learningRate", label: "Learn Rate", width: 100 },
  { key: "goals", label: "Goals", width: 70 },
  { key: "steps", label: "Steps", width: 80 },
  { key: "timeAlive", label: "Time (hrs)", width: 90 },
  { key: "messages", label: "Messages", width: 90 },
  { key: "errors", label: "Errors", width: 70 },
];

export function DataBrowserWindow() {
  const { agents, simulationTick } = useAppStore();
  const { fetchAgents } = useDataFetch();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.map(c => c.key));
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Get unique statuses
  const statuses = useMemo(() => {
    const s = new Set<string>();
    agents.forEach(a => { if (a.status) s.add(a.status); });
    return Array.from(s).sort();
  }, [agents]);

  // Filter and sort
  const processedAgents = useMemo(() => {
    let result = [...agents];

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(term) ||
        a.id.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortKey) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "knowledge":
          aVal = getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired"));
          bVal = getMetric(b, "knowledge_items_learned", getMetric(b, "knowledge_acquired"));
          break;
        case "distance":
          aVal = getMetric(a, "distance_traveled_km");
          bVal = getMetric(b, "distance_traveled_km");
          break;
        case "curiosity":
          aVal = getMetric(a, "curiosity_score");
          bVal = getMetric(b, "curiosity_score");
          break;
        case "goals":
          aVal = getMetric(a, "goals_achieved");
          bVal = getMetric(b, "goals_achieved");
          break;
        case "steps":
          aVal = getMetric(a, "total_steps_executed");
          bVal = getMetric(b, "total_steps_executed");
          break;
        case "errors":
          aVal = getMetric(a, "error_count");
          bVal = getMetric(b, "error_count");
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [agents, search, statusFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExportCSV = () => {
    const headers = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(c => c.label);
    const rows = processedAgents.map(a => {
      const row: string[] = [];
      if (visibleColumns.includes("name")) row.push(a.name);
      if (visibleColumns.includes("status")) row.push(a.status || "unknown");
      if (visibleColumns.includes("knowledge")) row.push(getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired")).toFixed(0));
      if (visibleColumns.includes("distance")) row.push(getMetric(a, "distance_traveled_km").toFixed(1));
      if (visibleColumns.includes("curiosity")) row.push((getMetric(a, "curiosity_score") * 100).toFixed(0) + "%");
      if (visibleColumns.includes("learningRate")) row.push(getMetric(a, "learning_rate").toFixed(3));
      if (visibleColumns.includes("goals")) row.push(getMetric(a, "goals_achieved").toFixed(0));
      if (visibleColumns.includes("steps")) row.push(getMetric(a, "total_steps_executed").toFixed(0));
      if (visibleColumns.includes("timeAlive")) row.push(getMetric(a, "time_alive_hours").toFixed(1));
      if (visibleColumns.includes("messages")) row.push((getMetric(a, "messages_sent") + getMetric(a, "messages_received")).toFixed(0));
      if (visibleColumns.includes("errors")) row.push(getMetric(a, "error_count").toFixed(0));
      return row.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `earthlink-data-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = processedAgents.map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      metrics: a.metrics,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `earthlink-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">Data Browser</h1>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {processedAgents.length} of {agents.length} agents
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Tick {simulationTick.toLocaleString()}</span>
            <button
              onClick={() => fetchAgents()}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="shrink-0 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-zinc-800 rounded px-2 py-1 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none flex-1"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={statusFilter || ""}
            onChange={e => setStatusFilter(e.target.value || null)}
            className="bg-zinc-800 text-sm text-zinc-200 rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-zinc-600"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Column Selector */}
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-1.5 px-2 py-1 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
            Columns
          </button>
          {showColumnSelector && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10 p-2">
              {ALL_COLUMNS.map(col => (
                <label key={col.key} className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-zinc-800 rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-zinc-600 bg-zinc-800 text-emerald-500"
                  />
                  <span className="text-sm text-zinc-300">{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Export Buttons */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
        <button
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          <Download className="w-4 h-4" />
          JSON
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
            <tr>
              {ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as SortKey)}
                  className="text-left px-3 py-2 text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 transition-colors"
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedAgents.map((agent, idx) => (
              <tr
                key={agent.id}
                className={`border-b border-zinc-800/50 hover:bg-zinc-900/50 ${idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}
              >
                {visibleColumns.includes("name") && (
                  <td className="px-3 py-2 text-zinc-200 font-medium">{agent.name}</td>
                )}
                {visibleColumns.includes("status") && (
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusClass(agent.status)}`}>
                      {agent.status || "unknown"}
                    </span>
                  </td>
                )}
                {visibleColumns.includes("knowledge") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired")).toFixed(0)}
                  </td>
                )}
                {visibleColumns.includes("distance") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {getMetric(agent, "distance_traveled_km").toFixed(1)}
                  </td>
                )}
                {visibleColumns.includes("curiosity") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {(getMetric(agent, "curiosity_score") * 100).toFixed(0)}%
                  </td>
                )}
                {visibleColumns.includes("learningRate") && (
                  <td className="px-3 py-2 text-zinc-300 font-mono">
                    {getMetric(agent, "learning_rate").toFixed(3)}
                  </td>
                )}
                {visibleColumns.includes("goals") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {getMetric(agent, "goals_achieved").toFixed(0)}
                  </td>
                )}
                {visibleColumns.includes("steps") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {getMetric(agent, "total_steps_executed").toFixed(0)}
                  </td>
                )}
                {visibleColumns.includes("timeAlive") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {getMetric(agent, "time_alive_hours").toFixed(1)}
                  </td>
                )}
                {visibleColumns.includes("messages") && (
                  <td className="px-3 py-2 text-zinc-300">
                    {(getMetric(agent, "messages_sent") + getMetric(agent, "messages_received")).toFixed(0)}
                  </td>
                )}
                {visibleColumns.includes("errors") && (
                  <td className="px-3 py-2">
                    <span className={getMetric(agent, "error_count") > 0 ? "text-red-400" : "text-zinc-500"}>
                      {getMetric(agent, "error_count").toFixed(0)}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {processedAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <Table className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500">No agents match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusClass(status?: string): string {
  const classes: Record<string, string> = {
    idle: "bg-zinc-700 text-zinc-300",
    exploring: "bg-emerald-500/20 text-emerald-400",
    learning: "bg-amber-500/20 text-amber-400",
    interacting: "bg-cyan-500/20 text-cyan-400",
    executing: "bg-green-500/20 text-green-400",
    adapting: "bg-violet-500/20 text-violet-400",
    overloaded: "bg-red-500/20 text-red-400",
    corrupted: "bg-red-700/20 text-red-300",
    retired: "bg-zinc-700 text-zinc-400",
  };
  return classes[status || ""] || "bg-zinc-700 text-zinc-400";
}


