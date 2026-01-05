/**
 * Agent Detail
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
  BookOpen,
  Layers,
  Command,
} from "lucide-react";
import { type Agent } from "@/stores/appStore";
import { useReadiness } from "@/hooks/useExplorer";
import { useCallback, useEffect, useState } from "react";
import { commandsApi, type CommandType } from "@/lib/api";

interface AgentDetailProps {
  agent: Agent;
  onClose: () => void;
}

function MetricDisplay({ label, value, icon }: { label: string; value: unknown; icon?: React.ReactNode }) {
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "number") return Number.isInteger(val) ? val.toString() : val.toFixed(2);
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length && entries.every(([, v]) => typeof v === "number")) {
        return entries
          .map(([k, v]) => `${k}:${(v as number).toFixed(2)}`)
          .join(" | ");
      }
      return JSON.stringify(val);
    }
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

export function AgentDetail({ agent, onClose }: AgentDetailProps) {
  const { readiness, calculateReadiness } = useReadiness();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "knowledge" | "episodes" | "commands">("overview");
  const [manualCommand, setManualCommand] = useState<CommandType>("autonomous_step");
  const [manualParams, setManualParams] = useState<string>("{}");
  const [commandStatus, setCommandStatus] = useState<string | null>(null);

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

  const metrics = agent.metrics || {};

  const knowledgeCount =
    (typeof metrics["knowledge_count"] === "number" && metrics["knowledge_count"]) ||
    (typeof metrics["knowledge_items_learned"] === "number" && metrics["knowledge_items_learned"]) ||
    null;

  const episodeTotals = {
    total: typeof metrics["total_episodes"] === "number" ? metrics["total_episodes"] as number : null,
    avgReward: typeof metrics["average_reward"] === "number" ? metrics["average_reward"] as number : null,
    bestReward: typeof metrics["best_reward"] === "number" ? metrics["best_reward"] as number : null,
    avgLength: typeof metrics["average_length"] === "number" ? metrics["average_length"] as number : null,
  };

  const knowledgeDomains = Array.isArray(agent["knowledge_domains"]) ? (agent["knowledge_domains"] as string[]) : [];
  const recentTopics = Array.isArray(agent["recent_topics"]) ? (agent["recent_topics"] as string[]) : [];

  // Curated agent-facing metrics only (avoid dumping everything; richer views live in Metrics component)
  const coreMetrics = [
    { key: "curiosity", label: "Curiosity", icon: <Sparkles className="w-3 h-3" /> },
    { key: "knowledge_count", label: "Knowledge", icon: <Brain className="w-3 h-3" /> },
    { key: "exploration_depth", label: "Exploration Depth", icon: <Compass className="w-3 h-3" /> },
    { key: "decision_distribution", label: "Action Mix", icon: <Activity className="w-3 h-3" /> },
    { key: "distance_traveled_km", label: "Distance (km)", icon: <Activity className="w-3 h-3" /> },
    { key: "steps", label: "Steps", icon: <Activity className="w-3 h-3" /> },
    { key: "total_reward", label: "Total Reward", icon: <Target className="w-3 h-3" /> },
    { key: "learning_rate", label: "Learning Rate", icon: <Brain className="w-3 h-3" /> },
    { key: "loss", label: "Loss", icon: <Brain className="w-3 h-3" /> },
    { key: "social_interactions", label: "Social Interactions", icon: <Users className="w-3 h-3" /> },
    { key: "messages_sent", label: "Messages Sent", icon: <Users className="w-3 h-3" /> },
  ];

  const commandOptions: CommandType[] = [
    "autonomous_step",
    "observe_environment",
    "explore_random",
    "move_to",
    "query_knowledge",
    "set_goal",
    "pause",
    "resume",
    "reset",
  ];

  const handleManualCommand = async () => {
    setCommandStatus(null);
    let parsed: Record<string, unknown> = {};
    if (manualParams.trim()) {
      try {
        parsed = JSON.parse(manualParams);
      } catch (e) {
        setCommandStatus("Invalid JSON parameters");
        return;
      }
    }

    setActionLoading("manual");
    try {
      await commandsApi.execute({
        type: manualCommand,
        agent_id: agent.id,
        parameters: parsed,
      });
      setCommandStatus("Command sent");
    } catch (e) {
      console.error("Failed to execute command", e);
      setCommandStatus("Command failed");
    } finally {
      setActionLoading(null);
    }
  };

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

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]/60">
        {[
          { id: "overview", label: "Overview" },
          { id: "metrics", label: "Metrics" },
          { id: "knowledge", label: "Knowledge" },
          { id: "episodes", label: "Episodes" },
          { id: "commands", label: "Commands" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${
              activeTab === tab.id
                ? "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-subtle)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === "overview" && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Identity
              </h4>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {agent.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(agent.status as string)} bg-opacity-20`}>
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

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Quick Stats
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Brain className="w-3 h-3" />
                    Knowledge
                  </div>
                  <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {knowledgeCount !== null ? knowledgeCount : "—"}
                  </div>
                </div>
                <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Activity className="w-3 h-3" />
                    Steps
                  </div>
                  <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {typeof metrics["steps"] === "number" ? metrics["steps"] as number : "—"}
                  </div>
                </div>
              </div>
            </div>

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
          </>
        )}

        {activeTab === "metrics" && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Curated Metrics
              </h4>

              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg space-y-1.5 border border-[var(--color-border-subtle)]">
                {coreMetrics
                  .filter((m) => metrics[m.key] !== undefined)
                  .map((m) => (
                    <MetricDisplay
                      key={m.key}
                      label={m.label}
                      value={metrics[m.key]}
                      icon={m.icon}
                    />
                  ))}

                {coreMetrics.filter((m) => metrics[m.key] !== undefined).length === 0 && (
                  <div className="text-xs text-[var(--color-text-muted)] text-center py-2">
                    No metrics available for this agent
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Raw Metrics Snapshot
              </h4>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)] space-y-2">
                {Object.keys(metrics).length === 0 && (
                  <div className="text-xs text-[var(--color-text-muted)]">No metrics reported yet.</div>
                )}
                {Object.entries(metrics).slice(0, 24).map(([key, value]) => (
                  <MetricDisplay key={key} label={key} value={value} />
                ))}
                {Object.keys(metrics).length > 24 && (
                  <div className="text-[10px] text-[var(--color-text-muted)]">Showing first 24 metrics</div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "knowledge" && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Knowledge Profile
              </h4>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Knowledge items</span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{knowledgeCount !== null ? knowledgeCount : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Learning rate</span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{typeof metrics["learning_rate"] === "number" ? (metrics["learning_rate"] as number).toFixed(3) : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Loss</span>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{typeof metrics["loss"] === "number" ? (metrics["loss"] as number).toFixed(3) : "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Domains & Topics
              </h4>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)] space-y-2">
                {knowledgeDomains.length === 0 && recentTopics.length === 0 && (
                  <div className="text-xs text-[var(--color-text-muted)]">No knowledge domains reported.</div>
                )}
                {knowledgeDomains.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] text-[var(--color-text-muted)]">Domains</div>
                    <div className="flex flex-wrap gap-1">
                      {knowledgeDomains.map((domain) => (
                        <span key={domain} className="px-2 py-1 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-[11px] border border-[var(--color-border-subtle)]">
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {recentTopics.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] text-[var(--color-text-muted)]">Recent topics</div>
                    <div className="flex flex-wrap gap-1">
                      {recentTopics.map((topic) => (
                        <span key={topic} className="px-2 py-1 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-[11px] border border-[var(--color-border-subtle)]">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "episodes" && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Episodes
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: "Total", value: episodeTotals.total }, { label: "Avg reward", value: episodeTotals.avgReward }, { label: "Best reward", value: episodeTotals.bestReward }, { label: "Avg length", value: episodeTotals.avgLength }].map((card) => (
                  <div key={card.label} className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)]">
                    <div className="text-[11px] text-[var(--color-text-muted)]">{card.label}</div>
                    <div className="text-lg font-semibold text-[var(--color-text-primary)]">{card.value !== null ? (typeof card.value === "number" ? card.value.toFixed(2) : card.value) : "—"}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                Episode timelines and detailed analytics live in the Metrics component; this view keeps the essentials.
              </div>
            </div>
          </>
        )}

        {activeTab === "commands" && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Command className="w-3 h-3" /> Manual Command
              </h4>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)] space-y-2">
                <div className="flex flex-col gap-2 text-xs">
                  <label className="text-[var(--color-text-muted)]">Command type</label>
                  <select
                    value={manualCommand}
                    onChange={(e) => setManualCommand(e.target.value as CommandType)}
                    className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)]"
                  >
                    {commandOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <label className="text-[var(--color-text-muted)]">Parameters (JSON)</label>
                  <textarea
                    value={manualParams}
                    onChange={(e) => setManualParams(e.target.value)}
                    rows={4}
                    className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-2 py-1 font-mono text-[12px] text-[var(--color-text-primary)]"
                  />

                  <button
                    onClick={handleManualCommand}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-primary)]/15 text-[var(--color-primary)] rounded border border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === "manual" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Command className="w-4 h-4" />
                    )}
                    Send command
                  </button>
                  {commandStatus && (
                    <div className="text-[11px] text-[var(--color-text-muted)]">{commandStatus}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

