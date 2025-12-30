import { useEffect, useCallback } from "react";
import { wsClient, simulationApi, agentsApi, healthApi, type Agent } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";

/**
 * Hook for WebSocket connection management.
 * Connects on mount, disconnects on unmount.
 */
export function useWebSocket() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const setAgents = useAppStore((s) => s.setAgents);

  useEffect(() => {
    // Connect on mount
    wsClient.connect();

    // Register handler for agent updates
    const handleAgentUpdate = (data: { payload?: { agents?: Agent[] } }) => {
      if (data.payload?.agents) {
        setAgents(data.payload.agents);
      }
    };

    wsClient.on("agent.updated", handleAgentUpdate);
    wsClient.on("agent_update", handleAgentUpdate);

    // Cleanup on unmount
    return () => {
      wsClient.off("agent.updated", handleAgentUpdate);
      wsClient.off("agent_update", handleAgentUpdate);
      wsClient.disconnect();
    };
  }, [setAgents]);

  return { connectionStatus };
}

/**
 * Hook for initial data fetching.
 * Fetches agents and simulation status when connection is established.
 */
export function useDataFetch() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const setAgents = useAppStore((s) => s.setAgents);

  const fetchAgents = useCallback(async () => {
    try {
      console.log("[useDataFetch] Fetching agents...");
      const response = await agentsApi.list();
      console.log("[useDataFetch] Agents response:", response);
      if (Array.isArray(response)) {
        setAgents(response);
        console.log("[useDataFetch] Set", response.length, "agents in store");
      } else {
        console.warn("[useDataFetch] Response is not an array:", response);
      }
    } catch (e) {
      console.error("[useDataFetch] Failed to fetch agents:", e);
    }
  }, [setAgents]);

  const checkHealth = useCallback(async () => {
    try {
      const health = await healthApi.check();
      console.log("[useDataFetch] Backend health:", health);
      return health.status === "healthy";
    } catch (e) {
      console.error("[useDataFetch] Backend not reachable:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    // Fetch initial data when connected
    if (connectionStatus === "connected") {
      fetchAgents();
    }
  }, [connectionStatus, fetchAgents]);

  useEffect(() => {
    // Fallback: attempt initial fetch on mount in case WS status lags
    fetchAgents();
  }, [fetchAgents]);

  return { fetchAgents, checkHealth };
}

/**
 * Hook for simulation control.
 * Provides start/pause/stop/resume controls.
 */
export function useSimulation() {
  const { 
    simulationState, 
    simulationTick, 
    simulationSpeed,
    startSimulation: setStarted,
    pauseSimulation: setPaused,
    stopSimulation: setStopped,
    setSimulationSpeed,
  } = useAppStore();

  const start = async () => {
    try {
      await simulationApi.start();
      setStarted();
    } catch (e) {
      console.error("Failed to start simulation:", e);
    }
  };

  const pause = async () => {
    try {
      await simulationApi.pause();
      setPaused();
    } catch (e) {
      console.error("Failed to pause simulation:", e);
    }
  };

  const stop = async () => {
    try {
      await simulationApi.stop();
      setStopped();
    } catch (e) {
      console.error("Failed to stop simulation:", e);
    }
  };

  const resume = async () => {
    try {
      await simulationApi.resume();
      setStarted();
    } catch (e) {
      console.error("Failed to resume simulation:", e);
    }
  };

  const fetchStatus = async () => {
    try {
      const status = await simulationApi.getStatus();
      // Update store based on backend state
      if (status.state === "running") {
        setStarted();
      } else if (status.state === "paused") {
        setPaused();
      } else {
        setStopped();
      }
    } catch (e) {
      console.error("Failed to fetch simulation status:", e);
    }
  };

  // Speed is controlled locally for now (backend may not support dynamic speed)
  const setSpeed = (speed: number) => {
    setSimulationSpeed(speed);
  };

  return {
    state: simulationState,
    tick: simulationTick,
    speed: simulationSpeed,
    start,
    pause,
    stop,
    resume,
    setSpeed,
    fetchStatus,
  };
}
