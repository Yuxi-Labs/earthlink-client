import {
  Search,
  X,
  ChevronRight,
  Brain,
  Compass,
  RefreshCw,
  Route,
  Filter,
  Circle,
} from "lucide-react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import { AgentDetail } from "./AgentDetail";
import { Tooltip } from "@/components/overlays/Tooltip";
import { useMemo, useState } from "react";

function getMetric(agent: Agent, key: string, fallback: number = 0): number {
  const val = agent.metrics?.[key];
  return typeof val === 'number' ? val : fallback;
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-zinc-500",
  exploring: "bg-emerald-500",
  learning: "bg-amber-500",
  interacting: "bg-cyan-500",
  executing: "bg-green-500",
  adapting: "bg-violet-500",
  overloaded: "bg-red-500",
  corrupted: "bg-red-600",
  retired: "bg-zinc-600",
};

function getStatusColor(status?: string) {
  return STATUS_COLORS[status ?? ""] || "bg-zinc-500";
}

function getStatusLabel(status?: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

function AgentCardItem({ agent, isSelected, onClick }: AgentCardProps) {
  const knowledge = getMetric(agent, 'knowledge_items_learned', getMetric(agent, 'knowledge_acquired'));
  const curiosity = getMetric(agent, 'curiosity_score') * 100;
  const distance = getMetric(agent, 'distance_traveled_km');
  const goals = getMetric(agent, 'goals_active');
  
  return (
    <div
      onClick={onClick}
      className={`
        px-3 py-2.5 cursor-pointer transition-colors border-l-2
        ${isSelected 
          ? "bg-zinc-800 border-l-blue-500" 
          : "border-l-transparent hover:bg-zinc-800/50"
        }
      `}
    >
      <div className="flex items-center gap-2.5">
        {/* Status indicator - node/circle, not avatar */}
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status as string)}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-200 truncate">
              {agent.name}
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500">
              {getStatusLabel(agent.status as string)}
            </span>
            {agent.target_world && (
              <span className="text-xs text-zinc-600">
                → {agent.target_world}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact metrics row */}
      <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3" />
          {knowledge.toFixed(0)}
        </span>
        <span className="flex items-center gap-1">
          <Compass className="w-3 h-3" />
          {goals}
        </span>
        <span className="flex items-center gap-1">
          <Route className="w-3 h-3" />
          {distance.toFixed(1)}km
        </span>
        <span className="text-zinc-600">
          {curiosity.toFixed(0)}% curious
        </span>
      </div>
    </div>
  );
}

export function AgentList() {
  const { agents, selectedAgentId, selectAgent, connectionStatus } = useAppStore();
  const { fetchAgents } = useDataFetch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const uniqueStatuses = useMemo(() => {
    const s = new Set<string>();
    agents.forEach((a) => { if (a.status) s.add(a.status); });
    return Array.from(s).sort();
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const term = search.trim().toLowerCase();
      const matchesSearch = term
        ? agent.name.toLowerCase().includes(term) || agent.id.toLowerCase().includes(term)
        : true;
      const matchesStatus = statusFilter ? agent.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  return (
    <div className="flex flex-col h-full relative">
      {selectedAgent && (
        <AgentDetail 
          agent={selectedAgent} 
          onClose={() => selectAgent(null)}
        />
      )}

      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">Agents</span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              {agents.length}
            </span>
          </div>
          <Tooltip content="Refresh agents" position="bottom">
            <button 
              onClick={() => fetchAgents()} 
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Tooltip content="Filter by status" position="bottom">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded transition-colors ${
                showFilters || statusFilter 
                  ? 'bg-zinc-700 text-zinc-200' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-1 mt-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                statusFilter === null 
                  ? "bg-blue-600 text-white" 
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
            {uniqueStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status === statusFilter ? null : status)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Circle className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-500">
              {connectionStatus === "connected" 
                ? "No agents match filters"
                : "Waiting for connection..."}
            </p>
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <AgentCardItem
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onClick={() => selectAgent(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

