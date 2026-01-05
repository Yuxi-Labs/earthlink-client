import type { Agent } from "@/stores/appStore";

export interface StatusMix {
  [status: string]: number;
}

export interface ActionMix {
  [action: string]: number;
}

export interface MetricSnapshot {
  tick: number;
  timestamp: number;
  agentCount: number;
  lifecycleCounts: StatusMix;
  statusCounts: StatusMix;
  actionMix: ActionMix;
  knowledgeTotal: number;
  knowledgeItemsTotal: number;
  knowledgeRate: number; // per tick delta
  curiosityAvg: number;
  rewardAvg: number;
  stepsAvg: number;
  distanceTotalKm: number;
  movingAgents: number;
  llmTokensTotal: number;
  llmTokenRate: number;
  commsTotal: number;
  commsRate: number;
  webCallsTotal: number;
  webCallRate: number;
  stepsTotal: number;
  failedStepsTotal: number;
  errorCountTotal: number;
  avgStepDurationMs: number;
}

const numberOr = (val: unknown, fallback = 0): number =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

const takeNumberFromKeys = (source: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const candidate = source[key];
    const num = numberOr(candidate, 0);
    if (num !== 0) return num;
  }
  return 0;
};

const mergeCounts = (acc: Record<string, number>, key: string, inc = 1) => {
  if (!key) return acc;
  acc[key] = (acc[key] || 0) + inc;
  return acc;
};

/**
 * Compute a metrics snapshot from current agents. Rates are per-tick deltas because
 * tick cadence is governed by the simulation tick stream.
 */
export function computeSnapshot(
  agents: Agent[],
  tick: number,
  prev?: MetricSnapshot
): MetricSnapshot {
  let knowledgeTotal = 0;
  let knowledgeItemsTotal = 0;
  let curiositySum = 0;
  let rewardSum = 0;
  let stepsSum = 0;
  let stepsTotal = 0;
  let failedStepsTotal = 0;
  let errorCountTotal = 0;
  let stepDurationSum = 0;
  let stepDurationCount = 0;
  let distanceTotalKm = 0;
  let movingAgents = 0;
  let llmTokensTotal = 0;
  let commsTotal = 0;
  let webCallsTotal = 0;

  const lifecycleCounts: StatusMix = {};
  const statusCounts: StatusMix = {};
  const actionMix: ActionMix = {};

  agents.forEach((agent) => {
    mergeCounts(lifecycleCounts, (agent.lifecycle as string) || "unknown");
    mergeCounts(statusCounts, (agent.status as string) || "unknown");

    const m = agent.metrics || {};
    knowledgeTotal += numberOr(m.knowledge_count);
    knowledgeItemsTotal += numberOr((m as Record<string, unknown>).knowledge_items_learned, numberOr(m.knowledge_acquired));
    curiositySum += numberOr(m.curiosity);
    rewardSum += numberOr(m.total_reward);
    stepsSum += numberOr(m.steps);
    stepsTotal += numberOr((m as Record<string, unknown>).total_steps_executed);
    failedStepsTotal += numberOr((m as Record<string, unknown>).failed_steps);
    errorCountTotal += numberOr((m as Record<string, unknown>).error_count);
    const stepDuration = numberOr((m as Record<string, unknown>).avg_step_duration_ms);
    if (stepDuration > 0) {
      stepDurationSum += stepDuration;
      stepDurationCount += 1;
    }

    // Distance metrics
    const distance = numberOr((m as Record<string, unknown>).distance_traveled_km);
    distanceTotalKm += distance;
    if (distance > 0) {
      movingAgents += 1;
    }

    // Language model + comms + web activity signals (best-effort across backend variants)
    const metricsRecord = m as Record<string, unknown>;
    llmTokensTotal += takeNumberFromKeys(metricsRecord, [
      "llm_tokens_total",
      "llm_tokens",
      "tokens_used",
      "token_usage",
    ]);

    commsTotal += takeNumberFromKeys(metricsRecord, [
      "messages_sent",
      "messages_processed",
      "comms_events",
      "communication_events",
      "signals",
    ]);

    webCallsTotal += takeNumberFromKeys(metricsRecord, [
      "web_requests",
      "http_calls",
      "browser_requests",
      "internet_calls",
      "api_calls",
    ]);

    // Action mix can come from decision_distribution or status as fallback
    const decisions = (m as Record<string, unknown>).decision_distribution as Record<string, unknown> | undefined;
    if (decisions) {
      Object.entries(decisions).forEach(([action, value]) => {
        mergeCounts(actionMix, action, numberOr(value, 0));
      });
    } else if (agent.status) {
      mergeCounts(actionMix, agent.status, 1);
    }
  });

  const agentCount = Math.max(agents.length, 1);
  const knowledgeRate = prev ? (knowledgeTotal - prev.knowledgeTotal) / Math.max(1, tick - prev.tick) : 0;
  const llmTokenRate = prev ? (llmTokensTotal - prev.llmTokensTotal) / Math.max(1, tick - prev.tick) : 0;
  const commsRate = prev ? (commsTotal - prev.commsTotal) / Math.max(1, tick - prev.tick) : 0;
  const webCallRate = prev ? (webCallsTotal - prev.webCallsTotal) / Math.max(1, tick - prev.tick) : 0;
  const avgStepDurationMs = stepDurationCount > 0 ? stepDurationSum / stepDurationCount : 0;

  return {
    tick,
    timestamp: Date.now(),
    agentCount: agents.length,
    lifecycleCounts,
    statusCounts,
    actionMix,
    knowledgeTotal,
    knowledgeItemsTotal,
    knowledgeRate,
    curiosityAvg: curiositySum / agentCount,
    rewardAvg: rewardSum / agentCount,
    stepsAvg: stepsSum / agentCount,
    distanceTotalKm,
    movingAgents,
    llmTokensTotal,
    llmTokenRate,
    commsTotal,
    commsRate,
    webCallsTotal,
    webCallRate,
    stepsTotal,
    failedStepsTotal,
    errorCountTotal,
    avgStepDurationMs,
  };
}
