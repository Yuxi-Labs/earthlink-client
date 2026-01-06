import { create } from "zustand";

export type ViewMode = "2d" | "2.5d" | "3d";
export type SimulationState = "stopped" | "running" | "paused";
export type ConnectionStatus = "connected" | "disconnected" | "connecting";

export type SignalSeverity = "info" | "warn" | "error";

export type LogLevel = "info" | "warn" | "error" | "debug";
export type LogSource = "ws" | "http" | "agents" | "sim" | "ui";

export interface LogEntry {
  id: number;
  ts: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  detail?: string;
}

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

export interface SignalEvent {
  id: number;
  ts: number;
  type: string;
  severity: SignalSeverity;
  agentId?: string;
  worldId?: string;
  payload?: unknown;
}

interface AppState {
  // Connection
  connectionStatus: ConnectionStatus;
  lastWsMessageTs: number | null;
  wsMessageCount: number;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWsMeta: (meta: { lastTs?: number | null; count?: number }) => void;

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
  showCoverageOverlay: boolean;
  showSignalOverlay: boolean;
  toggleAgentPanel: () => void;
  toggleMetricsPanel: () => void;
  toggleReadinessPanel: () => void;
  toggleTerminal: () => void;
  toggleCoverageOverlay: () => void;
  toggleSignalOverlay: () => void;

  // Agents
  agents: Agent[];
  selectedAgentId: string | null;
  agentCount: number;
  lastAgentUpdateMs: number | null;
  setAgents: (agents: Agent[]) => void;
  selectAgent: (id: string | null) => void;

  // Diagnostics
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "ts"> & { ts?: number }) => void;
  clearLogs: () => void;

  // Signals feed
  signals: SignalEvent[];
  addSignal: (entry: Omit<SignalEvent, "id" | "ts"> & { ts?: number }) => void;
  clearSignals: () => void;

  // Modals
  showExperimentModal: boolean;
  setShowExperimentModal: (show: boolean) => void;

  // Selected agent
  setSelectedAgentId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Connection
  connectionStatus: "disconnected",
  lastWsMessageTs: null,
  wsMessageCount: 0,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setWsMeta: (meta) => set((state) => ({
    lastWsMessageTs: meta.lastTs ?? state.lastWsMessageTs,
    wsMessageCount: typeof meta.count === "number" ? meta.count : state.wsMessageCount,
  })),

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
  showTerminal: true,
  showCoverageOverlay: true,   // ON by default - spatial density analysis
  showSignalOverlay: true,     // ON by default - activity intensity analysis
  toggleAgentPanel: () => set((state) => ({ showAgentPanel: !state.showAgentPanel })),
  toggleMetricsPanel: () => set((state) => ({ showMetricsPanel: !state.showMetricsPanel })),
  toggleReadinessPanel: () => set((state) => ({ showReadinessPanel: !state.showReadinessPanel })),
  toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
  toggleCoverageOverlay: () => set((state) => ({ showCoverageOverlay: !state.showCoverageOverlay })),
  toggleSignalOverlay: () => set((state) => ({ showSignalOverlay: !state.showSignalOverlay })),

  // Agents
  agents: [],
  selectedAgentId: null,
  agentCount: 0,
  lastAgentUpdateMs: null,
  setAgents: (agents) => set({ agents, agentCount: agents.length, lastAgentUpdateMs: Date.now() }),
  selectAgent: (id) => set({ selectedAgentId: id }),

  // Diagnostics
  logs: [],
  addLog: (entry) => set((state) => {
    const ts = entry.ts ?? Date.now();
    const next: LogEntry = { id: ts + Math.random(), ts, ...entry };
    const merged = [...state.logs, next].slice(-200);
    return { logs: merged };
  }),
  clearLogs: () => set({ logs: [] }),

  // Signals feed
  signals: [],
  addSignal: (entry) => set((state) => {
    const ts = entry.ts ?? Date.now();
    const next: SignalEvent = { id: ts + Math.random(), ts, ...entry };
    const merged = [...state.signals, next].slice(-300);
    return { signals: merged };
  }),
  clearSignals: () => set({ signals: [] }),

  // Modals
  showExperimentModal: false,
  setShowExperimentModal: (show) => set({ showExperimentModal: show }),

  // Selected agent (alias for backwards compat)
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
