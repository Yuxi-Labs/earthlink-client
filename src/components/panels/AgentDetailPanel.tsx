/**
 * Agent Detail Panel
 * 
 * Shows detailed information about a selected agent:
 * - Identity: name, id, status
 * - Metrics: all backend metrics displayed
 * - Target world assignment
 * - Quick actions
 */

import { 
  Bot, 
  X, 
  Activity, 
  Target, 
  Brain,
  Compass,
  Sparkles,
  Users,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";
import { type Agent } from "@/stores/appStore";
import { useReadiness } from "@/hooks/useExplorer";
import { useCallback, useEffect, useState } from "react";
import { commandsApi } from "@/lib/api";

interface AgentDetailPanelProps {
  agent: Agent;
  onClose: () => void;
}

function MetricDisplay({ label, value, icon }: { label: string; value: unknown; icon?: React.ReactNode }) {
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "number") return val.toFixed(2);
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border-subtle)] last:border-0">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-xs font-mono text-[var(--color-text-primary)]">
        {formatValue(value)}
      </span>
    </div>
  );
}

function ReadinessBar({ score, label }: { score: number; label: string }) {
  const getColor = () => {
    if (score >= 0.8) return "bg-[var(--color-success)]";
    if (score >= 0.5) return "bg-[var(--color-warning)]";
    return "bg-[var(--color-error)]";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="text-[var(--color-text-primary)]">{(score * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${getColor()}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const { readiness, calculateReadiness } = useReadiness();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    calculateReadiness(agent.id);
  }, [agent.id, calculateReadiness]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "idle": return "bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]";
      case "exploring": return "bg-[var(--color-accent)]/20 text-[var(--color-accent)]";
      case "learning": return "bg-[var(--color-warning)]/20 text-[var(--color-warning)]";
      case "interacting": return "bg-[var(--color-primary)]/20 text-[var(--color-primary)]";
      case "executing": return "bg-[var(--color-success)]/20 text-[var(--color-success)]";
      case "adapting": return "bg-purple-500/20 text-purple-400";
      case "overloaded": return "bg-[var(--color-error)]/20 text-[var(--color-error)]";
      case "corrupted": return "bg-red-500/20 text-red-400";
      case "retired": return "bg-[var(--color-text-secondary)]/20 text-[var(--color-text-secondary)]";
      default: return "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]";
    }
  };

  const handleAction = useCallback(async (action: "pause" | "resume" | "reset") => {
    setActionLoading(action);
    try {
      await commandsApi.execute({
        type: action,
        agent_id: agent.id,
      });
    } catch (e) {
      console.error(`Failed to ${action} agent:`, e);
    } finally {
      setActionLoading(null);
    }
  }, [agent.id]);

  // Extract metrics safely
  const metrics = agent.metrics || {};
  const knownMetrics = [
    { key: "knowledge_count", label: "Knowledge Count", icon: <Brain className="w-3 h-3" /> },
    { key: "exploration_depth", label: "Exploration Depth", icon: <Compass className="w-3 h-3" /> },
    { key: "curiosity", label: "Curiosity", icon: <Sparkles className="w-3 h-3" /> },
    { key: "social_interactions", label: "Social Interactions", icon: <Users className="w-3 h-3" /> },
    { key: "steps", label: "Steps", icon: <Activity className="w-3 h-3" /> },
    { key: "total_reward", label: "Total Reward", icon: <Target className="w-3 h-3" /> },
  ];

  return (
    <div className="absolute inset-0 bg-[var(--color-bg-secondary)] z-10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Agent Details
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Identity */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Identity
          </h4>
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {agent.name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(agent.status as string)}`}>
                {agent.status || "unknown"}
              </span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-mono">
              {agent.id}
            </div>
            {agent.target_world && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Target className="w-3 h-3" />
                Target: {agent.target_world}
              </div>
            )}
          </div>
        </div>

        {/* Readiness */}
        {readiness && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Readiness
            </h4>
            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-primary)]">
                  Overall
                </span>
                <span className={`text-sm font-medium ${readiness.is_ready ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>
                  {(readiness.readiness_score * 100).toFixed(0)}%
                </span>
              </div>
              
              {readiness.component_scores && (
                <div className="space-y-2">
                  <ReadinessBar score={readiness.component_scores.knowledge_coverage} label="Knowledge" />
                  <ReadinessBar score={readiness.component_scores.exploration_depth} label="Exploration" />
                  <ReadinessBar score={readiness.component_scores.spatial_competence} label="Spatial" />
                  <ReadinessBar score={readiness.component_scores.curiosity_level} label="Curiosity" />
                  <ReadinessBar score={readiness.component_scores.collaboration_score} label="Collaboration" />
                  <ReadinessBar score={readiness.component_scores.goal_achievement} label="Goals" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Metrics
          </h4>
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            {knownMetrics.map((m) => (
              <MetricDisplay 
                key={m.key} 
                label={m.label} 
                value={metrics[m.key]} 
                icon={m.icon}
              />
            ))}
            
            {/* Show any unknown metrics from backend */}
            {Object.entries(metrics)
              .filter(([key]) => !knownMetrics.some((m) => m.key === key))
              .map(([key, value]) => (
                <MetricDisplay key={key} label={key} value={value} />
              ))
            }

            {Object.keys(metrics).length === 0 && (
              <div className="text-xs text-[var(--color-text-muted)] text-center py-2">
                No metrics available
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Actions
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAction("pause")}
              disabled={actionLoading !== null}
              className="flex flex-col items-center gap-1 p-2 bg-[var(--color-bg-tertiary)] rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors disabled:opacity-50"
            >
              {actionLoading === "pause" ? (
                <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)] animate-spin" />
              ) : (
                <Pause className="w-4 h-4 text-[var(--color-warning)]" />
              )}
              <span className="text-xs text-[var(--color-text-muted)]">Pause</span>
            </button>
            <button
              onClick={() => handleAction("resume")}
              disabled={actionLoading !== null}
              className="flex flex-col items-center gap-1 p-2 bg-[var(--color-bg-tertiary)] rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors disabled:opacity-50"
            >
              {actionLoading === "resume" ? (
                <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)] animate-spin" />
              ) : (
                <Play className="w-4 h-4 text-[var(--color-success)]" />
              )}
              <span className="text-xs text-[var(--color-text-muted)]">Resume</span>
            </button>
            <button
              onClick={() => handleAction("reset")}
              disabled={actionLoading !== null}
              className="flex flex-col items-center gap-1 p-2 bg-[var(--color-bg-tertiary)] rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors disabled:opacity-50"
            >
              {actionLoading === "reset" ? (
                <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)] animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 text-[var(--color-primary)]" />
              )}
              <span className="text-xs text-[var(--color-text-muted)]">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
