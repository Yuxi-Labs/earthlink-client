/**
 * Hooks for Explorer Pipeline features.
 * - Readiness tracking
 * - Target worlds
 * - Knowledge analytics
 */

import { useState, useCallback, useEffect } from "react";
import { 
  readinessApi, 
  targetWorldsApi, 
  analyticsApi,
  type ReadinessScore,
  type TargetWorld,
  type KnowledgeAcquisition,
} from "@/lib/api";

/**
 * Hook for agent readiness tracking.
 */
export function useReadiness(agentId?: string) {
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateReadiness = useCallback(async (id: string, targetWorldId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await readinessApi.calculate(id, { target_world_id: targetWorldId });
      setReadiness(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to calculate readiness";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await readinessApi.getSummary(id);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch readiness summary";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when agentId is provided
  useEffect(() => {
    if (agentId) {
      fetchSummary(agentId);
    }
  }, [agentId, fetchSummary]);

  return {
    readiness,
    loading,
    error,
    calculateReadiness,
    fetchSummary,
  };
}

/**
 * Hook for target worlds management.
 */
export function useTargetWorlds() {
  const [worlds, setWorlds] = useState<TargetWorld[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorlds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await targetWorldsApi.list();
      setWorlds(result.target_worlds || []);
      return result.target_worlds;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch target worlds";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getWorld = useCallback(async (id: string) => {
    try {
      return await targetWorldsApi.get(id);
    } catch (e) {
      console.error("Failed to get target world:", e);
      return null;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  return {
    worlds,
    loading,
    error,
    fetchWorlds,
    getWorld,
  };
}

/**
 * Hook for knowledge acquisition analytics.
 */
export function useKnowledgeAnalytics(options?: {
  agentId?: string;
  source?: string;
  hours?: number;
  limit?: number;
}) {
  const [acquisitions, setAcquisitions] = useState<KnowledgeAcquisition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAcquisitions = useCallback(async (opts?: {
    agent_id?: string;
    source?: string;
    hours?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getKnowledgeAcquisition(opts);
      setAcquisitions(result.acquisitions);
      setTotal(result.total);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch knowledge acquisitions";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (opts?: { agent_id?: string; hours?: number }) => {
    try {
      return await analyticsApi.getKnowledgeStats(opts);
    } catch (e) {
      console.error("Failed to fetch knowledge stats:", e);
      return null;
    }
  }, []);

  // Fetch on mount if options provided
  useEffect(() => {
    if (options) {
      fetchAcquisitions({
        agent_id: options.agentId,
        source: options.source,
        hours: options.hours,
        limit: options.limit,
      });
    }
  }, [options?.agentId, options?.source, options?.hours, options?.limit, fetchAcquisitions]);

  return {
    acquisitions,
    total,
    loading,
    error,
    fetchAcquisitions,
    fetchStats,
  };
}
