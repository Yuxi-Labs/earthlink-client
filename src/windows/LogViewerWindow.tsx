/**
 * Log Viewer Window
 * 
 * System logs with filtering and search
 */

import { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Download,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
} from "lucide-react";
import "@/App.css";

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

export function LogViewerWindow() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Mock logs
  const logs: LogEntry[] = [
    { id: "1", timestamp: "2024-01-03 10:00:01", level: "info", source: "System", message: "Earthlink started" },
    { id: "2", timestamp: "2024-01-03 10:00:02", level: "info", source: "Backend", message: "WebSocket connection established" },
    { id: "3", timestamp: "2024-01-03 10:00:03", level: "info", source: "Simulation", message: "Loaded 5 agents from state" },
    { id: "4", timestamp: "2024-01-03 10:00:10", level: "debug", source: "Agent-A1", message: "Starting exploration loop" },
    { id: "5", timestamp: "2024-01-03 10:00:15", level: "info", source: "Agent-A1", message: "Querying Wikipedia for 'Australia geography'" },
    { id: "6", timestamp: "2024-01-03 10:00:16", level: "debug", source: "Agent-A1", message: "Received 3 knowledge items" },
    { id: "7", timestamp: "2024-01-03 10:00:20", level: "warn", source: "API", message: "Rate limit approaching: 45/50 requests" },
    { id: "8", timestamp: "2024-01-03 10:00:25", level: "info", source: "Agent-A2", message: "Goal achieved: explore_region(sydney)" },
    { id: "9", timestamp: "2024-01-03 10:00:30", level: "error", source: "Agent-A3", message: "Failed to connect to Ollama: connection refused" },
    { id: "10", timestamp: "2024-01-03 10:00:31", level: "warn", source: "System", message: "Agent A3 falling back to cached responses" },
    { id: "11", timestamp: "2024-01-03 10:00:35", level: "debug", source: "Simulation", message: "Tick 1000 completed in 45ms" },
    { id: "12", timestamp: "2024-01-03 10:00:40", level: "info", source: "Agent-A1", message: "Encountered Agent-A2, initiating communication" },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = search.trim()
      ? log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.source.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesLevel = levelFilter ? log.level === levelFilter : true;
    return matchesSearch && matchesLevel;
  });

  const levelConfig: Record<LogLevel, { icon: React.ElementType; color: string; bg: string }> = {
    error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
    debug: { icon: Bug, color: "text-zinc-500", bg: "bg-zinc-500/10" },
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-semibold">Log Viewer</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="shrink-0 px-4 py-2 border-b border-zinc-800 flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-zinc-500" />
          {(["error", "warn", "info", "debug"] as LogLevel[]).map(level => {
            const config = levelConfig[level];
            return (
              <button
                key={level}
                onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  levelFilter === level
                    ? `${config.bg} ${config.color}`
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>

        {/* Auto-scroll */}
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800"
          />
          Auto-scroll
        </label>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {filteredLogs.map(log => {
          const config = levelConfig[log.level];
          const Icon = config.icon;
          return (
            <div
              key={log.id}
              className={`flex items-start gap-3 px-4 py-1.5 hover:bg-zinc-900 ${
                log.level === "error" ? "bg-red-500/5" : ""
              }`}
            >
              <span className="text-zinc-600 shrink-0 w-36">{log.timestamp}</span>
              <span className={`shrink-0 w-12 flex items-center gap-1 ${config.color}`}>
                <Icon className="w-3 h-3" />
                {log.level}
              </span>
              <span className="text-zinc-500 shrink-0 w-24 truncate">[{log.source}]</span>
              <span className="text-zinc-300 flex-1">{log.message}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-2 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
        <span>{filteredLogs.length} entries</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            {logs.filter(l => l.level === "error").length}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {logs.filter(l => l.level === "warn").length}
          </span>
        </div>
      </footer>
    </div>
  );
}


