/**
 * Memory Browser Window
 * 
 * Browse agent memory contents in detail
 */

import { useState, useEffect } from "react";
import {
  Database,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Brain,
  Lightbulb,
  Settings,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import "@/App.css";

interface MemoryBrowserWindowProps {
  agentId?: string;
}

export function MemoryBrowserWindow({ agentId }: MemoryBrowserWindowProps) {
  const { agents } = useAppStore();
  const { fetchAgents } = useDataFetch();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const agent = agents.find(a => a.id === agentId);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Mock memory data
  const memories = [
    { id: "1", type: "episodic", content: "Visited Sydney region at tick 1234. Observed high urban density.", timestamp: 1234, importance: 0.8, associations: ["geography", "australia", "cities"] },
    { id: "2", type: "semantic", content: "Australia is a country and continent surrounded by the Indian and Pacific oceans.", timestamp: 1100, importance: 0.95, associations: ["australia", "geography", "facts"] },
    { id: "3", type: "semantic", content: "The Great Barrier Reef is the world's largest coral reef system.", timestamp: 1500, importance: 0.9, associations: ["australia", "nature", "ocean"] },
    { id: "4", type: "procedural", content: "Navigate using curiosity gradient: move toward regions with highest uncertainty in world model.", timestamp: 800, importance: 0.85, associations: ["navigation", "exploration", "strategy"] },
    { id: "5", type: "episodic", content: "Encountered Agent A2 near Melbourne at tick 2100. Exchanged knowledge about coastal regions.", timestamp: 2100, importance: 0.7, associations: ["social", "knowledge-transfer", "melbourne"] },
    { id: "6", type: "semantic", content: "Melbourne is the second most populous city in Australia.", timestamp: 2200, importance: 0.75, associations: ["melbourne", "cities", "australia"] },
    { id: "7", type: "procedural", content: "When curiosity score drops below 0.3, switch from exploration to exploitation mode.", timestamp: 1800, importance: 0.8, associations: ["strategy", "behavior", "curiosity"] },
    { id: "8", type: "episodic", content: "Error encountered at tick 3000: Wikipedia API rate limited. Switched to cached data.", timestamp: 3000, importance: 0.6, associations: ["error", "api", "wikipedia"] },
  ];

  const filteredMemories = memories.filter(m => {
    const matchesSearch = search.trim()
      ? m.content.toLowerCase().includes(search.toLowerCase()) ||
        m.associations.some(a => a.toLowerCase().includes(search.toLowerCase()))
      : true;
    const matchesType = typeFilter ? m.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const typeColors: Record<string, string> = {
    episodic: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    semantic: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    procedural: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const typeIcons: Record<string, React.ElementType> = {
    episodic: Clock,
    semantic: Brain,
    procedural: Settings,
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-violet-400" />
            <div>
              <h1 className="text-lg font-semibold">Memory Browser</h1>
              <p className="text-xs text-zinc-500">
                {agent ? agent.name : agentId || "No agent selected"}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAgents()}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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
            placeholder="Search memories..."
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-zinc-500" />
          {["episodic", "semantic", "procedural"].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                typeFilter === type
                  ? typeColors[type]
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredMemories.map(memory => {
          const Icon = typeIcons[memory.type];
          return (
            <div
              key={memory.id}
              className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${typeColors[memory.type]}`}>
                    <Icon className="w-3 h-3" />
                    {memory.type}
                  </span>
                  <span className="text-xs text-zinc-600">T{memory.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-zinc-600" />
                  <span className="text-xs text-zinc-500">{(memory.importance * 100).toFixed(0)}%</span>
                </div>
              </div>

              <p className="text-sm text-zinc-300 mb-3">{memory.content}</p>

              <div className="flex flex-wrap gap-1.5">
                {memory.associations.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded cursor-pointer hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
                    onClick={() => setSearch(tag)}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {filteredMemories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
            <Database className="w-10 h-10 mb-3 text-zinc-700" />
            <p>No memories match your search</p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <footer className="shrink-0 px-4 py-2 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
        <span>{filteredMemories.length} of {memories.length} memories</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            {memories.filter(m => m.type === "episodic").length} episodic
          </span>
          <span className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-emerald-400" />
            {memories.filter(m => m.type === "semantic").length} semantic
          </span>
          <span className="flex items-center gap-1">
            <Settings className="w-3 h-3 text-amber-400" />
            {memories.filter(m => m.type === "procedural").length} procedural
          </span>
        </div>
      </footer>
    </div>
  );
}

