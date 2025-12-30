import { create } from "zustand";

export type ViewMode = "2d" | "2.5d" | "3d";
export type SimulationState = "stopped" | "running" | "paused";
export type ConnectionStatus = "connected" | "disconnected" | "connecting";

// Agent as received from backend - flexible structure
// The backend defines the schema, frontend just receives it
export interface Agent {
  id: string;
  name: string;
  lifecycle?: string;  // Backend defines lifecycle states (internal)
  status?: string;     // UI-facing status from backend
  target_world: string | null;
  metrics: Record<string, unknown>;  // Backend defines metrics dynamically
  [key: string]: unknown;  // Allow any additional fields from backend
}

interface AppState {
  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // View
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Simulation
  simulationState: SimulationState;
  simulationTick: number;
  simulationSpeed: number;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  setSimulationTick: (tick: number) => void;

  // Panels
  showAgentPanel: boolean;
  showMetricsPanel: boolean;
  showReadinessPanel: boolean;
  showTerminal: boolean;
  toggleAgentPanel: () => void;
  toggleMetricsPanel: () => void;
  toggleReadinessPanel: () => void;
  toggleTerminal: () => void;

  // Agents
  agents: Agent[];
  selectedAgentId: string | null;
  agentCount: number;
  setAgents: (agents: Agent[]) => void;
  selectAgent: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Connection
  connectionStatus: "disconnected",
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // View
  viewMode: "2d",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Simulation
  simulationState: "stopped",
  simulationTick: 0,
  simulationSpeed: 1,
  startSimulation: () => set({ simulationState: "running" }),
  pauseSimulation: () => set({ simulationState: "paused" }),
  stopSimulation: () => set({ simulationState: "stopped", simulationTick: 0 }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setSimulationTick: (tick) => set({ simulationTick: tick }),

  // Panels
  showAgentPanel: true,
  showMetricsPanel: true,
  showReadinessPanel: false,
  showTerminal: false,
  toggleAgentPanel: () => set((state) => ({ showAgentPanel: !state.showAgentPanel })),
  toggleMetricsPanel: () => set((state) => ({ showMetricsPanel: !state.showMetricsPanel })),
  toggleReadinessPanel: () => set((state) => ({ showReadinessPanel: !state.showReadinessPanel })),
  toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),

  // Agents
  agents: [],
  selectedAgentId: null,
  agentCount: 0,
  setAgents: (agents) => set({ agents, agentCount: agents.length }),
  selectAgent: (id) => set({ selectedAgentId: id }),
}));
