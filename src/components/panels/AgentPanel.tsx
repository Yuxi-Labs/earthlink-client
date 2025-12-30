import { 
  Bot, 
  Search, 
  Filter,
  ChevronRight,
  Circle,
  Brain,
  Compass,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import { AgentDetailPanel } from "./AgentDetailPanel";

// Helper to safely get a numeric metric from agent
function getMetric(agent: Agent, key: string, fallback: number = 0): number {
  const val = agent.metrics?.[key];
  return typeof val === 'number' ? val : fallback;
}

export function AgentPanel() {
  const { agents, selectedAgentId, selectAgent, connectionStatus } = useAppStore();
  const { fetchAgents } = useDataFetch();
  
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "idle": return "text-[var(--color-text-muted)]";
      case "exploring": return "text-[var(--color-accent)]";
      case "learning": return "text-[var(--color-warning)]";
      case "interacting": return "text-[var(--color-primary)]";
      case "executing": return "text-[var(--color-success)]";
      case "adapting": return "text-purple-400";
      case "overloaded": return "text-[var(--color-error)]";
      case "corrupted": return "text-red-500";
      case "retired": return "text-[var(--color-text-secondary)]";
      default: return "text-[var(--color-text-secondary)]";
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Agent Detail Overlay */}
      {selectedAgent && (
        <AgentDetailPanel 
          agent={selectedAgent} 
          onClose={() => selectAgent(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <Bot className="w-4 h-4" />
          <span>Agents</span>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
            {agents.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fetchAgents()} 
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Refresh agents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bot className="w-8 h-8 text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]">
              {connectionStatus === "connected" 
                ? "No agents spawned yet"
                : "Waiting for backend connection..."}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Agents are created and managed by the backend
            </p>
          </div>
        ) : (
          agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => selectAgent(agent.id)}
            className={`
              px-3 py-2 border-b border-[var(--color-border-subtle)] cursor-pointer
              transition-colors
              ${selectedAgentId === agent.id 
                ? "bg-[var(--color-primary)]/10 border-l-2 border-l-[var(--color-primary)]" 
                : "hover:bg-[var(--color-bg-tertiary)]"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className={`w-2 h-2 fill-current ${getStatusColor(agent.status as string)}`} />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {agent.name}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
            
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              {getStatusLabel(agent.status as string)}
              {agent.target_world && <span className="ml-2">→ {agent.target_world}</span>}
            </div>

            {/* Agent metrics - safely accessed from dynamic backend data */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]" title="Knowledge Acquired">
                <Brain className="w-3 h-3" />
                <span>{getMetric(agent, 'knowledge_acquired').toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]" title="Curiosity Score">
                <Sparkles className="w-3 h-3" />
                <span>{(getMetric(agent, 'curiosity_score') * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]" title="Topics Explored">
                <Compass className="w-3 h-3" />
                <span>{getMetric(agent, 'topics_explored')}</span>
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}
