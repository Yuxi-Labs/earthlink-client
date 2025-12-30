/**
 * Explorer Readiness Dashboard
 * 
 * Displays agent readiness for deployment to target worlds.
 * Shows 6-component readiness breakdown.
 */

import { useState } from "react";
import { 
  Rocket, 
  Brain, 
  Compass, 
  MapPin, 
  Sparkles, 
  Users, 
  Target,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { useReadiness, useTargetWorlds } from "@/hooks/useExplorer";

interface ReadinessComponentProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

function ReadinessComponent({ label, score, icon }: ReadinessComponentProps) {
  const percentage = Math.round(score * 100);
  const getColor = (s: number) => {
    if (s >= 0.8) return "text-[var(--color-success)]";
    if (s >= 0.6) return "text-[var(--color-warning)]";
    return "text-[var(--color-error)]";
  };

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`${getColor(score)}`}>{icon}</span>
      <span className="flex-1 text-xs text-[var(--color-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              score >= 0.8 ? "bg-[var(--color-success)]" :
              score >= 0.6 ? "bg-[var(--color-warning)]" :
              "bg-[var(--color-error)]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${getColor(score)}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

interface AgentReadinessCardProps {
  agent: Agent;
  onCalculate: () => void;
  isCalculating: boolean;
}

function AgentReadinessCard({ agent, onCalculate, isCalculating }: AgentReadinessCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Get readiness from agent metrics if available
  const readiness = agent.metrics?.readiness_score as number | undefined;
  const isReady = readiness !== undefined && readiness >= 0.7;
  const componentScores = agent.metrics?.component_scores as Record<string, number> | undefined;

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-bg-tertiary)] cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
        )}
        
        <span className="flex-1 font-medium text-sm text-[var(--color-text-primary)]">
          {agent.name}
        </span>

        {readiness !== undefined ? (
          <div className="flex items-center gap-2">
            {isReady ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            ) : (
              <XCircle className="w-4 h-4 text-[var(--color-warning)]" />
            )}
            <span className={`text-xs font-medium ${
              isReady ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"
            }`}>
              {Math.round(readiness * 100)}%
            </span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCalculate();
            }}
            disabled={isCalculating}
            className="px-2 py-1 text-xs bg-[var(--color-primary)] text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
          >
            {isCalculating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>Calculate</>
            )}
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && componentScores && (
        <div className="px-3 py-2 border-t border-[var(--color-border-subtle)]">
          <ReadinessComponent 
            label="Knowledge Coverage"
            score={componentScores.knowledge_coverage ?? 0}
            icon={<Brain className="w-3.5 h-3.5" />}
          />
          <ReadinessComponent 
            label="Exploration Depth"
            score={componentScores.exploration_depth ?? 0}
            icon={<Compass className="w-3.5 h-3.5" />}
          />
          <ReadinessComponent 
            label="Spatial Competence"
            score={componentScores.spatial_competence ?? 0}
            icon={<MapPin className="w-3.5 h-3.5" />}
          />
          <ReadinessComponent 
            label="Curiosity Level"
            score={componentScores.curiosity_level ?? 0}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          />
          <ReadinessComponent 
            label="Collaboration"
            score={componentScores.collaboration_score ?? 0}
            icon={<Users className="w-3.5 h-3.5" />}
          />
          <ReadinessComponent 
            label="Goal Achievement"
            score={componentScores.goal_achievement ?? 0}
            icon={<Target className="w-3.5 h-3.5" />}
          />
        </div>
      )}
    </div>
  );
}

export function ReadinessPanel() {
  const { agents } = useAppStore();
  const { calculateReadiness, loading: calculatingReadiness } = useReadiness();
  const { worlds: targetWorlds } = useTargetWorlds();
  const [calculatingAgent, setCalculatingAgent] = useState<string | null>(null);

  const handleCalculate = async (agentId: string) => {
    setCalculatingAgent(agentId);
    await calculateReadiness(agentId);
    setCalculatingAgent(null);
  };

  // Count ready vs not ready
  const readyAgents = agents.filter(a => {
    const score = a.metrics?.readiness_score as number | undefined;
    return score !== undefined && score >= 0.7;
  }).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <Rocket className="w-4 h-4" />
          <span>Explorer Readiness</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">
            {readyAgents}/{agents.length} ready
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
            <div className="text-lg font-semibold text-[var(--color-text-primary)]">
              {agents.length}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Total</div>
          </div>
          <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
            <div className="text-lg font-semibold text-[var(--color-success)]">
              {readyAgents}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Ready</div>
          </div>
          <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
            <div className="text-lg font-semibold text-[var(--color-warning)]">
              {agents.length - readyAgents}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Training</div>
          </div>
        </div>

        {/* Target Worlds */}
        {targetWorlds.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Target Worlds
            </h3>
            <div className="space-y-1">
              {targetWorlds.slice(0, 5).map((world) => (
                <div 
                  key={world.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-[var(--color-bg-tertiary)] rounded text-xs"
                >
                  <Target className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span className="flex-1 text-[var(--color-text-primary)]">{world.name}</span>
                  <span className="text-[var(--color-text-muted)] capitalize">{world.world_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Readiness List */}
        <div>
          <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
            Agent Readiness
          </h3>
          {agents.length === 0 ? (
            <div className="text-center py-4 text-sm text-[var(--color-text-muted)]">
              No agents to evaluate
            </div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <AgentReadinessCard
                  key={agent.id}
                  agent={agent}
                  onCalculate={() => handleCalculate(agent.id)}
                  isCalculating={calculatingAgent === agent.id && calculatingReadiness}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
