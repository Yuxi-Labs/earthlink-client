import { useEffect, useCallback, useRef } from "react";
import { wsClient, simulationApi, agentsApi, healthApi } from "@/lib/api";
import { useAppStore, type Agent } from "@/stores/appStore";

/**
 * Hook for WebSocket connection management.
 * Connects on mount, disconnects on unmount.
 */
export function useWebSocket() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const setAgents = useAppStore((s) => s.setAgents);
  const addLog = useAppStore((s) => s.addLog);
  const addSignal = useAppStore((s) => s.addSignal);

  useEffect(() => {
    // Connect on mount
    wsClient.connect();

    addLog({ level: "info", source: "ws", message: "Connecting to backend" });

    // Register handler for agent updates
    const handleAgentUpdate = (data: unknown) => {
      const payload = (data as { payload?: { agents?: Agent[] } })?.payload;
      if (payload?.agents) {
        setAgents(payload.agents);
        addLog({ level: "info", source: "agents", message: `Received agents payload (${payload.agents.length})` });
      }
    };

    wsClient.on("agent.updated", handleAgentUpdate as any);
    wsClient.on("agent_update", handleAgentUpdate as any);

    // Wildcard handler for diagnostics and signal feed
    const handleAny = (data: any) => {
      addLog({ level: "debug", source: "ws", message: `WS message ${data?.type || "unknown"}` });
      if (data?.type) {
        addSignal({ type: data.type, severity: "info", payload: data.payload });
      }
    };

    wsClient.on("*", handleAny);

    // Cleanup on unmount
    return () => {
      wsClient.off("agent.updated", handleAgentUpdate as any);
      wsClient.off("agent_update", handleAgentUpdate as any);
      wsClient.off("*", handleAny);
      wsClient.disconnect();
    };
  }, [setAgents, addLog, addSignal]);

  return { connectionStatus };
}

/**
 * Hook for initial data fetching.
 * Fetches agents and simulation status when connection is established.
 */
export function useDataFetch() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const setAgents = useAppStore((s) => s.setAgents);
  const lastFetchRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchAgents = useCallback(async (reason = "initial", force = false) => {
    const now = Date.now();
    if (inFlightRef.current) {
      useAppStore.getState().addLog({ level: "debug", source: "agents", message: `Skip fetch (${reason}) — already in-flight` });
      return;
    }
    // Skip throttle check on forced fetches (like initial mount)
    if (!force && now - lastFetchRef.current < 5000) {
      useAppStore.getState().addLog({ level: "debug", source: "agents", message: `Skip fetch (${reason}) — throttled` });
      return;
    }

    try {
      inFlightRef.current = true;
      console.log("[useDataFetch] Fetching agents...", reason, "force:", force);
      useAppStore.getState().addLog({ level: "info", source: "agents", message: `Fetching agents (HTTP) [${reason}]` });
      const response = await agentsApi.list();
      console.log("[useDataFetch] Agents response:", response);
      if (Array.isArray(response)) {
        setAgents(response as Agent[]);
        console.log("[useDataFetch] Set", response.length, "agents in store");
        useAppStore.getState().addLog({ level: "info", source: "agents", message: `Fetched ${response.length} agents [${reason}]` });
      } else {
        console.warn("[useDataFetch] Response is not an array:", response);
        useAppStore.getState().addLog({ level: "warn", source: "agents", message: "Agents response not array" });
      }
    } catch (e) {
      console.error("[useDataFetch] Failed to fetch agents:", e);
      useAppStore.getState().addLog({ level: "error", source: "agents", message: "Failed to fetch agents", detail: String(e) });
    } finally {
      lastFetchRef.current = Date.now();
      inFlightRef.current = false;
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
      fetchAgents("ws-connected");
    }
  }, [connectionStatus, fetchAgents]);

  useEffect(() => {
    // Force immediate fetch on mount - bypass throttle
    fetchAgents("mount", true);
  }, []);

  return {
    fetchAgents,
    checkHealth,
  };
}

/**
 * Hook for simulation control (start, pause, stop, resume, speed).
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
