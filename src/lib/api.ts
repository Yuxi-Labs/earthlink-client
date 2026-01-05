/**
 * Earthlink API Client
 * 
 * Complete API client for the Earthlink backend.
 * See _docs/BACKEND-API.md for full documentation.
 */

import { useAppStore } from "@/stores/appStore";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${new URL(API_BASE).host}/api/v1/ws/stream`;

// ============================================================================
// Types
// ============================================================================

// Generic API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Health types
export interface HealthStatus {
  status: string;
  service: string;
}

export interface SystemHealth {
  service: string;
  version: string;
  timestamp: string;
  system: {
    cpu_percent: number;
    memory_percent: number;
    memory_available_gb: number;
    disk_percent: number;
    disk_free_gb: number;
  };
  simulation?: {
    state: string;
    total_steps: number;
    active_agents: number;
    active_worlds: number;
  };
  ray?: {
    initialized: boolean;
    cpu_available?: number;
    memory_gb?: number;
    gpu_available?: number;
  };
}

// Simulation types
export interface SimulationStatus {
  state: string;
  tick: number;
  steps_per_second: number;
  total_agents: number;
  total_worlds: number;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  lifecycle?: string;
  status?: string;
  target_world: string | null;
  metrics: Record<string, unknown>;
}

export interface AgentCreateRequest {
  name: string;
  config?: {
    observation_dim?: number;
    action_dim?: number;
  };
}

// World types
export interface World {
  id: string;
  name: string;
  world_type: string;
  description?: string;
  observation_dim: number;
  action_dim: number;
}

export interface WorldCreateRequest {
  world_id: string;
  name: string;
  world_type?: string;
  description?: string;
  observation_dim?: number;
  action_dim?: number;
}

// Target World types
export interface TargetWorld {
  id: string;
  name: string;
  world_type: string;
  description: string | null;
  region_code: string | null;
  bounding_box: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  } | null;
  complexity_score: number | null;
  feature_count: number | null;
  required_knowledge_domains: string[] | null;
  deployment_status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TargetWorldCreateRequest {
  name: string;
  world_type: "earth_region" | "virtual_world" | "game_world" | "simulation";
  description?: string;
  region_code?: string;
  bounding_box?: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  complexity_score?: number;
  feature_count?: number;
  required_knowledge_domains?: string[];
  deployment_status?: "pending" | "active" | "inactive" | "archived";
  metadata?: Record<string, unknown>;
}

// Episode types
export interface EpisodeStats {
  total_episodes: number;
  avg_reward: number;
  avg_length: number;
  best_reward: number;
}

export interface Episode {
  id: string;
  agent_id: string;
  world_id: string;
  reward: number;
  length: number;
  timestamp: string;
}

// Readiness types
export interface ReadinessScore {
  agent_id: string;
  target_world_id: string | null;
  readiness_score: number;
  is_ready: boolean;
  readiness_threshold: number;
  component_scores: {
    knowledge_coverage: number;
    exploration_depth: number;
    spatial_competence: number;
    curiosity_level: number;
    collaboration_score: number;
    goal_achievement: number;
  };
  training_metrics: Record<string, unknown>;
  evaluated_at: string;
}

// Analytics types
export interface KnowledgeAcquisition {
  id: string;
  agent_id: string;
  what: {
    topic: string;
    source: string;
    knowledge_count: number;
    content_summary: string | null;
  };
  when: string;
  why: {
    goal_context: string | null;
    curiosity_signal: number | null;
  };
  where: {
    lat: number | null;
    lon: number | null;
  };
  quality: {
    relevance_score: number | null;
    novelty_score: number | null;
  };
}

// Geo types
export interface GeoFeature {
  id: string;
  category: string;
  name: string | null;
  lat: number;
  lon: number;
  properties: Record<string, unknown>;
}

export interface LocationContext {
  lat: number;
  lon: number;
  features: GeoFeature[];
  regions: unknown[];
}

// Command types
export type CommandType =
  | "move_to"
  | "explore_random"
  | "navigate_to_poi"
  | "explore_topic"
  | "query_knowledge"
  | "learn_from_observation"
  | "send_message"
  | "broadcast_message"
  | "query_nearby"
  | "observe_environment"
  | "set_goal"
  | "autonomous_step"
  | "reset"
  | "pause"
  | "resume"
  | "shutdown";

export interface Command {
  type: CommandType;
  agent_id?: string;
  world_id?: string;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Snapshot types
export interface Snapshot {
  name: string;
  path: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// HTTP Client
// ============================================================================

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }
    return response.json();
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }
    return response.json();
  }
}

// Create HTTP clients
const apiV1 = new HttpClient(API_V1);
const apiBase = new HttpClient(API_BASE);

// ============================================================================
// API Modules
// ============================================================================

/**
 * Health & Status API
 */
export const healthApi = {
  /** Basic health check */
  check: () => apiBase.get<HealthStatus>("/health"),
  
  /** Kubernetes liveness probe */
  live: () => apiBase.get<{ status: string; timestamp: string }>("/health/live"),
  
  /** Kubernetes readiness probe */
  ready: () => apiBase.get<{ status: string; checks: Record<string, boolean>; timestamp: string }>("/health/ready"),
  
  /** Comprehensive system status */
  status: () => apiBase.get<SystemHealth>("/health/status"),
};

/**
 * Simulation Control API
 */
export const simulationApi = {
  /** Get current simulation state */
  getStatus: () => apiV1.get<SimulationStatus>("/simulation/status"),
  
  /** Start the simulation */
  start: () => apiV1.post<{ message: string; state: string }>("/simulation/start"),
  
  /** Pause the simulation */
  pause: () => apiV1.post<{ message: string; state: string }>("/simulation/pause"),
  
  /** Resume a paused simulation */
  resume: () => apiV1.post<{ message: string; state: string }>("/simulation/resume"),
  
  /** Stop the simulation */
  stop: () => apiV1.post<{ message: string; state: string }>("/simulation/stop"),
};

/**
 * Agents API
 */
export const agentsApi = {
  /** List all agents */
  // Backend returns a plain array of agents (not wrapped in an object)
  list: () => apiV1.get<Agent[]>("/agents"),
  
  /** Create a new agent */
  create: (data: AgentCreateRequest) => apiV1.post<Agent>("/agents", data),
  
  /** Get agent by ID */
  get: (id: string) => apiV1.get<Agent>(`/agents/${id}`),
  
  /** Destroy an agent */
  destroy: (id: string) => apiV1.delete<{ message: string; id: string }>(`/agents/${id}`),
  
  /** Assign agent to a world */
  assignWorld: (agentId: string, worldId: string) => 
    apiV1.post<{ message: string; agent_id: string; world_id: string }>(
      `/agents/${agentId}/assign-world`,
      { world_id: worldId }
    ),
  
  /** Get agent metrics */
  getMetrics: (id: string) => apiV1.get<{ agent_id: string; metrics: Record<string, unknown> }>(`/agents/${id}/metrics`),
};

// ============================================================================
// Agent Capabilities Types
// ============================================================================

export interface PerceptionState {
  current_location: Record<string, unknown>;
  nearby_features: unknown[];
  recent_observations: unknown[];
  attention_focus: string | null;
  sensory_inputs: {
    spatial: Record<string, unknown>;
    social: Record<string, unknown>;
    data: Record<string, unknown>;
  };
}

export interface Hypothesis {
  id: string;
  text: string;
  confidence: number;
  status: string;
}

export interface CausalRelation {
  id: string;
  cause: string;
  effect: string;
  strength: number;
}

export interface ReasoningState {
  hypotheses: Hypothesis[];
  predictions: unknown[];
  causal_relations: CausalRelation[];
  prediction_accuracy: number;
  hypotheses_confirmed: number;
  hypotheses_rejected: number;
  current_inference: unknown | null;
}

export interface DecisionState {
  last_decision: Record<string, unknown>;
  decision_history: unknown[];
  available_actions: unknown[];
  utility_breakdown: Record<string, number>;
  risk_assessment: Record<string, unknown>;
  decision_strategy: string;
  total_decisions: number;
}

export interface MemoryState {
  episodic: { count: number; recent: unknown[] };
  semantic: { count: number; categories: string[] };
  procedural: { count: number; skills: string[] };
  working: { items: unknown[]; capacity: number };
  consolidation_pending: number;
  total_memories: number;
}

export interface WorldModelState {
  regions: Record<string, unknown>;
  entities: Record<string, unknown>;
  relationships: unknown[];
  confidence: number;
  last_updated: string | null;
  model_accuracy: number;
}

export interface AdaptationState {
  current_strategy: string;
  strategy_history: unknown[];
  detected_shifts: unknown[];
  behavior_modifications: unknown[];
  adaptation_events: unknown[];
  performance_baseline: Record<string, unknown>;
}

export interface MonitoringState {
  performance: {
    avg_step_duration_ms: number;
    p95_step_duration_ms: number;
    success_rate: number;
    error_count: number;
  };
  uncertainty: {
    decision_confidence: number;
    prediction_uncertainty: number;
    calibration_score: number;
  };
  diagnosis: Record<string, unknown>;
  health_status: string;
  alerts: unknown[];
}

export interface SpecializationState {
  primary_domain: string | null;
  expertise_levels: Record<string, number>;
  niche_discovered: string | null;
  specialization_score: number;
  domain_history: unknown[];
}

export interface EvolutionState {
  generation: number;
  parent_id: string | null;
  offspring_ids: string[];
  fitness_score: number;
  mutations: unknown[];
  genetic_lineage: unknown[];
}

export interface KnowledgeTransferState {
  extracted_knowledge: unknown[];
  shared_with_agents: string[];
  received_from_agents: string[];
  collective_contributions: number;
  transfer_success_rate: number;
}

export interface OutputsState {
  maps: unknown[];
  summaries: unknown[];
  theories: unknown[];
  reports: unknown[];
  total_outputs: number;
}

export interface CapabilitySummary {
  active: boolean;
  [key: string]: unknown;
}

export interface AllCapabilities {
  perceive: CapabilitySummary;
  explore: CapabilitySummary;
  learn: CapabilitySummary;
  reason: CapabilitySummary;
  decide: CapabilitySummary;
  act: CapabilitySummary;
  communicate: CapabilitySummary;
  model: CapabilitySummary;
  adapt: CapabilitySummary;
  monitor: CapabilitySummary;
  memory: CapabilitySummary;
  transfer: CapabilitySummary;
  evolve: CapabilitySummary;
  specialize: CapabilitySummary;
  generate: CapabilitySummary;
}

/**
 * Agent Capabilities API - All 15 capabilities
 */
export const capabilitiesApi = {
  /** Get perception state */
  getPerception: (agentId: string) => 
    apiV1.get<{ agent_id: string; perception: PerceptionState }>(`/capabilities/${agentId}/perception`),
  
  /** Get exploration state */
  getExploration: (agentId: string) => 
    apiV1.get<{ agent_id: string; exploration: Record<string, unknown> }>(`/capabilities/${agentId}/exploration`),
  
  /** Get learning state */
  getLearning: (agentId: string) => 
    apiV1.get<{ agent_id: string; learning: Record<string, unknown> }>(`/capabilities/${agentId}/learning`),
  
  /** Get reasoning state - hypotheses, predictions, causal inferences */
  getReasoning: (agentId: string) => 
    apiV1.get<{ agent_id: string; reasoning: ReasoningState }>(`/capabilities/${agentId}/reasoning`),
  
  /** Get decision state - utility, risk, rationale */
  getDecisions: (agentId: string) => 
    apiV1.get<{ agent_id: string; decisions: DecisionState }>(`/capabilities/${agentId}/decisions`),
  
  /** Get action state */
  getActions: (agentId: string) => 
    apiV1.get<{ agent_id: string; actions: Record<string, unknown> }>(`/capabilities/${agentId}/actions`),
  
  /** Get communication state */
  getCommunication: (agentId: string) => 
    apiV1.get<{ agent_id: string; communication: Record<string, unknown> }>(`/capabilities/${agentId}/communication`),
  
  /** Get world model state */
  getWorldModel: (agentId: string) => 
    apiV1.get<{ agent_id: string; world_model: WorldModelState; agent_models: Record<string, unknown>; concept_abstractions: unknown[] }>(`/capabilities/${agentId}/world-model`),
  
  /** Get adaptation state */
  getAdaptation: (agentId: string) => 
    apiV1.get<{ agent_id: string; adaptation: AdaptationState }>(`/capabilities/${agentId}/adaptation`),
  
  /** Get self-monitoring state */
  getMonitoring: (agentId: string) => 
    apiV1.get<{ agent_id: string; monitoring: MonitoringState }>(`/capabilities/${agentId}/monitoring`),
  
  /** Get memory state */
  getMemory: (agentId: string) => 
    apiV1.get<{ agent_id: string; memory: MemoryState }>(`/capabilities/${agentId}/memory`),
  
  /** Get knowledge transfer state */
  getKnowledgeTransfer: (agentId: string) => 
    apiV1.get<{ agent_id: string; knowledge_transfer: KnowledgeTransferState }>(`/capabilities/${agentId}/knowledge-transfer`),
  
  /** Get evolution state */
  getEvolution: (agentId: string) => 
    apiV1.get<{ agent_id: string; evolution: EvolutionState }>(`/capabilities/${agentId}/evolution`),
  
  /** Get specialization state */
  getSpecialization: (agentId: string) => 
    apiV1.get<{ agent_id: string; specialization: SpecializationState }>(`/capabilities/${agentId}/specialization`),
  
  /** Get generated outputs */
  getOutputs: (agentId: string) => 
    apiV1.get<{ agent_id: string; outputs: OutputsState }>(`/capabilities/${agentId}/outputs`),
  
  /** Get all capabilities summary */
  getAll: (agentId: string) => 
    apiV1.get<{ agent_id: string; capabilities: AllCapabilities }>(`/capabilities/${agentId}/all`),
};

/**
 * Earth API - the simulation's world state
 */
export const earthApi = {
  /** Get Earth metadata */
  get: () => apiV1.get<World>("/earth"),
  
  /** Get current Earth state */
  getState: () => apiV1.get<{ loaded: boolean; metadata: World; current_step: number }>("/earth/state"),
  
  /** Get observation space */
  getObservationSpace: () => apiV1.get<{ type: string; shape?: number[]; dtype?: string }>("/earth/observation-space"),
  
  /** Get action space */
  getActionSpace: () => apiV1.get<{ type: string; n?: number; actions?: string[] }>("/earth/action-space"),
  
  /** Reset Earth to initial state */
  reset: () => apiV1.post<{ message: string; initial_observation: unknown }>("/earth/reset"),
};

/**
 * Target Worlds API
 */
export const targetWorldsApi = {
  /** List all target worlds */
  list: () => apiV1.get<{ target_worlds: TargetWorld[]; count: number }>("/target-worlds"),
  
  /** Create a target world */
  create: (data: TargetWorldCreateRequest) => apiV1.post<TargetWorld>("/target-worlds", data),
  
  /** Get target world by ID */
  get: (id: string) => apiV1.get<TargetWorld>(`/target-worlds/${id}`),
  
  /** Update target world */
  update: (id: string, data: Partial<TargetWorldCreateRequest>) => 
    apiV1.patch<TargetWorld>(`/target-worlds/${id}`, data),
};

/**
 * Episodes API
 */
export const episodesApi = {
  /** Get episode statistics */
  getStats: () => apiV1.get<EpisodeStats>("/episodes/stats"),
  
  /** Get recent episodes */
  getRecent: (limit = 10) => 
    apiV1.get<{ episodes: Episode[]; count: number }>("/episodes/recent", { limit }),
  
  /** Get best performing episodes */
  getBest: (limit = 10, by = "reward") => 
    apiV1.get<{ episodes: Episode[]; count: number; sorted_by: string }>("/episodes/best", { limit, by }),
  
  /** Get episodes for specific agent */
  getByAgent: (agentId: string, limit = 10) => 
    apiV1.get<{ agent_id: string; episodes: Episode[]; count: number }>(`/episodes/agent/${agentId}`, { limit }),
  
  /** Get episodes for specific world */
  getByWorld: (worldId: string, limit = 10) => 
    apiV1.get<{ world_id: string; episodes: Episode[]; count: number }>(`/episodes/world/${worldId}`, { limit }),
};

/**
 * Metrics API
 */
export const metricsApi = {
  /** Record a single metric */
  record: (agentId: string, metricName: string, metricValue: number, metadata?: Record<string, unknown>) =>
    apiV1.post<{ message: string }>(`/metrics/agents/${agentId}/metrics`, {
      metric_name: metricName,
      metric_value: metricValue,
      metadata,
    }),
  
  /** Record multiple metrics at once */
  recordBatch: (agentId: string, metrics: Record<string, number>, metadata?: Record<string, unknown>) =>
    apiV1.post<{ message: string }>(`/metrics/agents/${agentId}/metrics/batch`, { metrics, metadata }),
  
  /** Get agent metrics history */
  getHistory: (agentId: string, options?: {
    metric_names?: string[];
    start_time?: string;
    end_time?: string;
    limit?: number;
  }) => apiV1.get<Record<string, unknown>[]>(`/metrics/agents/${agentId}/metrics`, options as Record<string, string | number | boolean>),
};

/**
 * Analytics API
 */
export const analyticsApi = {
  /** Get knowledge acquisition logs */
  getKnowledgeAcquisition: (options?: {
    agent_id?: string;
    source?: string;
    hours?: number;
    limit?: number;
  }) => apiV1.get<{ total: number; acquisitions: KnowledgeAcquisition[] }>(
    "/analytics/knowledge-acquisition",
    options as Record<string, string | number | boolean>
  ),
  
  /** Get knowledge statistics */
  getKnowledgeStats: (options?: { agent_id?: string; hours?: number }) =>
    apiV1.get<Record<string, unknown>>("/analytics/knowledge-stats", options as Record<string, string | number | boolean>),
};

/**
 * Readiness Pipeline API
 */
export const readinessApi = {
  /** Calculate agent readiness */
  calculate: (agentId: string, _options?: {
    target_world_id?: string;
    readiness_threshold?: number;
    save?: boolean;
  }) => apiV1.post<ReadinessScore>(
    `/readiness/calculate/${agentId}`,
    undefined
  ),
  
  /** Get agent readiness summary */
  getSummary: (agentId: string) => apiV1.get<{
    agent_id: string;
    overall_readiness: number;
    is_ready: boolean;
    world_readiness: Record<string, unknown>[];
    last_evaluated: string | null;
  }>(`/readiness/agents/${agentId}`),
};

/**
 * Geospatial API
 */
export const geoApi = {
  /** Get features near a point */
  getNearby: (lat: number, lon: number, radiusMeters = 1000, limit = 10) =>
    apiBase.get<{ lat: number; lon: number; radius_meters: number; features: GeoFeature[]; count: number }>(
      "/geo/nearby",
      { lat, lon, radius_meters: radiusMeters, limit }
    ),
  
  /** Get information about a geographic region */
  getRegion: (regionName: string) => apiBase.get<Record<string, unknown>>(`/geo/region/${regionName}`),
  
  /** Get comprehensive location context */
  getContext: (lat: number, lon: number) =>
    apiBase.get<LocationContext>("/geo/context", { lat, lon }),
  
  /** Execute custom spatial query */
  query: (queryType: "within" | "intersects" | "contains" | "nearest", params: Record<string, unknown>) =>
    apiBase.post<{ query_type: string; params: Record<string, unknown>; results: unknown[]; count: number }>(
      "/geo/query",
      { query_type: queryType, params }
    ),
};

/**
 * Earthlink API (43M+ OSM features)
 */
export const earthlinkApi = {
  /** Get features near a point */
  getNearby: (lat: number, lon: number, options?: {
    radius_meters?: number;
    limit?: number;
    types?: string;
  }) => apiV1.get<{
    lat: number;
    lon: number;
    radius_meters: number;
    features: GeoFeature[];
    by_category: Record<string, GeoFeature[]>;
    total: number;
  }>("/earthlink/nearby", { lat, lon, ...options } as Record<string, string | number | boolean>),
  
  /** Get comprehensive location context */
  getContext: (lat: number, lon: number, radiusMeters = 5000) =>
    apiV1.get<Record<string, unknown>>("/earthlink/context", { lat, lon, radius_meters: radiusMeters }),
  
  /** Get administrative boundaries containing a point */
  getRegions: (lat: number, lon: number) =>
    apiV1.get<Record<string, unknown>>("/earthlink/regions", { lat, lon }),
};

/**
 * Social Media API
 */
export const socialApi = {
  reddit: {
    /** Get posts from a subreddit */
    getSubreddit: (subreddit: string, options?: {
      sort?: "hot" | "new" | "top" | "rising";
      limit?: number;
      time_filter?: "hour" | "day" | "week" | "month" | "year" | "all";
    }) => apiV1.get<{ subreddit: string; count: number; posts: Record<string, unknown>[] }>(
      `/social/reddit/subreddit/${subreddit}`,
      options as Record<string, string | number | boolean>
    ),
    
    /** Get comments from a post */
    getComments: (subreddit: string, postId: string, options?: {
      limit?: number;
      sort?: "best" | "top" | "new" | "controversial" | "old";
    }) => apiV1.get<{ post_id: string; comments: Record<string, unknown>[] }>(
      `/social/reddit/post/${subreddit}/${postId}/comments`,
      options as Record<string, string | number | boolean>
    ),
  },
};

/**
 * Commands API
 */
export const commandsApi = {
  /** Execute a command */
  execute: (command: Command) =>
    apiV1.post<{ success: boolean; result: Record<string, unknown> | null; error: string | null }>(
      "/commands/execute",
      command
    ),
  
  /** Execute multiple commands */
  executeBatch: (commands: Command[], sequential = true) =>
    apiV1.post<{ results: { success: boolean; result: Record<string, unknown> | null; error: string | null }[] }>(
      "/commands/batch",
      { commands, sequential }
    ),
};

/**
 * Messaging API
 */
export const messagingApi = {
  /** Send message between agents */
  send: (fromAgentId: string, toAgentId: string, content: string, metadata?: Record<string, unknown>) =>
    apiV1.post<{ message: string }>("/messaging/send", {
      from_agent_id: fromAgentId,
      to_agent_id: toAgentId,
      content,
      metadata,
    }),
  
  /** Get agent's messages */
  getInbox: (agentId: string, limit = 50) =>
    apiV1.get<{ agent_id: string; messages: Record<string, unknown>[]; count: number }>(
      `/messaging/inbox/${agentId}`,
      { limit }
    ),
};

/**
 * Snapshots API
 */
export const snapshotsApi = {
  /** Save current simulation state */
  save: (name?: string, metadata?: Record<string, unknown>) =>
    apiV1.post<{ message: string; name: string; path: string }>("/snapshots/save", { name, metadata }),
  
  /** Load a snapshot */
  load: (name: string) => apiV1.post<{ message: string }>(`/snapshots/load/${name}`),
  
  /** List all snapshots */
  list: () => apiV1.get<{ snapshots: Snapshot[]; count: number }>("/snapshots/list"),
  
  /** Delete a snapshot */
  delete: (name: string) => apiV1.delete<{ message: string }>(`/snapshots/${name}`),
};

// ============================================================================
// WebSocket Client
// ============================================================================

export type SubscriptionChannel = "all" | "agents" | "worlds" | "simulation" | "metrics";

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
  agent_id?: string;
  world_id?: string;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, ((data: WebSocketMessage) => void)[]> = new Map();
  private messageCount = 0;
  private lastMessageTs: number | null = null;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Only show "connecting" on first attempt, not on reconnects
    if (this.reconnectAttempts === 0) {
      useAppStore.getState().setConnectionStatus("connecting");
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log("[WS] Connected to backend");
        useAppStore.getState().setConnectionStatus("connected");
        useAppStore.getState().addLog({ level: "info", source: "ws", message: "WebSocket connected" });
        this.messageCount = 0;
        this.lastMessageTs = null;
        this.reconnectAttempts = 0;

        // Subscribe to all channels by default
        this.subscribe(["all"]);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          this.messageCount += 1;
          this.lastMessageTs = Date.now();
          // Throttle store updates to avoid render loops - only update every 10 messages
          if (this.messageCount % 10 === 0) {
            useAppStore.getState().setWsMeta({ lastTs: this.lastMessageTs, count: this.messageCount });
          }
          // Only log first few messages to avoid spam
          if (this.messageCount <= 3) {
            let payloadPreview = "";
            try {
              payloadPreview = ` payload=${JSON.stringify(data).slice(0, 240)}`;
            } catch {
              payloadPreview = " payload=[unserializable]";
            }
            useAppStore.getState().addLog({ level: "debug", source: "ws", message: `ws message: ${data.type} (#${this.messageCount})${payloadPreview}` });
          }
          this.handleMessage(data);
        } catch (e) {
          console.error("[WS] Failed to parse message:", e);
        }
      };

      this.ws.onclose = (event) => {
        console.log("[WS] Disconnected from backend");
        useAppStore.getState().setConnectionStatus("disconnected");
        useAppStore.getState().addLog({
          level: "warn",
          source: "ws",
          message: "WebSocket disconnected",
          detail: `code=${event.code} reason=${event.reason || "n/a"} clean=${event.wasClean} messages=${this.messageCount}`,
        });
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("[WS] Error:", error);
        useAppStore.getState().setConnectionStatus("disconnected");
        useAppStore.getState().addLog({ level: "error", source: "ws", message: "WebSocket error", detail: String((error as Event)?.type || error) });
      };
    } catch (error) {
      console.error("[WS] Failed to connect:", error);
      useAppStore.getState().setConnectionStatus("disconnected");
      useAppStore.getState().addLog({ level: "error", source: "ws", message: "WebSocket connect failed", detail: String(error) });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WS] Max reconnect attempts reached - staying disconnected");
      useAppStore.getState().setConnectionStatus("disconnected");
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[WS] Reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${delay}ms...`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private handleMessage(data: WebSocketMessage) {
    const store = useAppStore.getState();

    // Handle built-in message types
    switch (data.type) {
      case "simulation.tick":
      case "simulation_update": {
        const payload = data.payload as { tick?: number; state?: string };
        if (payload?.tick !== undefined) {
          store.setSimulationTick(payload.tick);
        }
        store.setWsMeta({ lastTs: Date.now() });
        store.addSignal({ type: data.type, severity: "info", payload: payload || data.payload });
        break;
      }

      case "agent.updated":
      case "agent_update": {
        // Handle both full agent list and individual agent updates
        const payload = (data.payload || (data as any).data) as { agents?: Agent[]; agent_id?: string; status?: string; lifecycle?: string } | undefined;
        
        if (payload?.agents) {
          // Full agent list update
          store.setAgents(payload.agents as any);
          store.addSignal({ type: data.type, severity: "info", payload: { count: payload.agents.length } });
        } else if (payload?.agent_id || data.agent_id) {
          // Individual agent status/lifecycle update
          const agentId = payload?.agent_id || data.agent_id;
          const currentAgents = store.agents;
          const agentIndex = currentAgents.findIndex(a => a.id === agentId);
          
          if (agentIndex >= 0) {
            // Update existing agent
            const updatedAgent = { ...currentAgents[agentIndex] };
            if (payload?.status) updatedAgent.status = payload.status;
            if (payload?.lifecycle) updatedAgent.lifecycle = payload.lifecycle;
            
            const newAgents = [...currentAgents];
            newAgents[agentIndex] = updatedAgent;
            store.setAgents(newAgents);
            
            console.log(`[WS] Updated agent ${agentId}: status=${payload?.status}, lifecycle=${payload?.lifecycle}`);
            store.addSignal({ type: data.type, severity: "info", agentId, payload: { status: payload?.status, lifecycle: payload?.lifecycle } });
          }
        }
        store.setWsMeta({ lastTs: Date.now() });
        break;
      }

      case "agent.action": {
        const payload = (data.payload || (data as any).data) as { action?: Record<string, unknown>; agent_id?: string } | undefined;
        const action = payload?.action as Record<string, unknown> | undefined;
        const agentId = data.agent_id || payload?.agent_id;

        if (action && agentId) {
          const currentAgents = store.agents;
          const idx = currentAgents.findIndex((a) => a.id === agentId);

          if (idx >= 0) {
            const updated = { ...currentAgents[idx] } as Record<string, unknown>;
            const metrics = { ...(currentAgents[idx].metrics || {}) } as Record<string, unknown>;
            const actionData = action as Record<string, unknown> | undefined;

            // Apply position updates from move actions
            const position = (actionData as any)?.position ?? (actionData as any)?.to;
            if (Array.isArray(position)) {
              const [lat, lon, alt] = position as unknown[];
              updated.location = {
                ...(updated.location as Record<string, unknown> | undefined),
                x: typeof lat === "number" ? lat : (updated.location as any)?.x,
                y: typeof lon === "number" ? lon : (updated.location as any)?.y,
                z: typeof alt === "number" ? alt : (updated.location as any)?.z ?? 0,
              };
            }

            // Merge metrics like distance traveled when available
            const distance = (actionData as any)?.distance_km;
            if (typeof distance === "number" && Number.isFinite(distance)) {
              const prev = typeof metrics.distance_traveled_km === "number" ? metrics.distance_traveled_km : 0;
              metrics.distance_traveled_km = prev + distance;
            }

            if (typeof (actionData as any)?.type === "string" && (actionData as any).type === "move") {
              updated.status = "exploring";
            }

            updated.metrics = metrics;

            const next = [...currentAgents];
            next[idx] = updated as any;
            store.setAgents(next as any);
            store.addSignal({ type: data.type, severity: "info", agentId, payload: action });
          }
        }
        store.setWsMeta({ lastTs: Date.now() });
        break;
      }

      case "metrics.agent":
      case "metrics_update":
        // Handle metrics updates and merge into the agent record
        {
          const payload = data.payload as { agent_id?: string; metrics?: Record<string, unknown> };
          const agentId = payload?.agent_id || data.agent_id;
          if (agentId && payload?.metrics) {
            const currentAgents = store.agents;
            const idx = currentAgents.findIndex((a) => a.id === agentId);
            if (idx >= 0) {
              const updated = { ...currentAgents[idx], metrics: { ...(currentAgents[idx].metrics || {}), ...payload.metrics } };
              const next = [...currentAgents];
              next[idx] = updated;
              store.setAgents(next);
              store.addSignal({ type: data.type, severity: "info", agentId, payload: payload.metrics });
            }
          }
        }
        store.setWsMeta({ lastTs: Date.now() });
        break;
    }

    // Call custom handlers
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }

    // Call wildcard handlers
    const wildcardHandlers = this.messageHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler(data));
    }
  }

  /** Subscribe to channels */
  subscribe(channels: SubscriptionChannel[], agentIds?: string[], worldIds?: string[]) {
    useAppStore.getState().addLog({ level: "info", source: "ws", message: `Subscribing: ${channels.join(",")}` });
    this.send({
      type: "subscribe",
      channels,
      agent_ids: agentIds,
      world_ids: worldIds,
    });
  }

  /** Unsubscribe from channels */
  unsubscribe(channels: SubscriptionChannel[], agentIds?: string[], worldIds?: string[]) {
    this.send({
      type: "unsubscribe",
      channels,
      agent_ids: agentIds,
      world_ids: worldIds,
    });
  }

  /** Register a message handler */
  on(messageType: string, handler: (data: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /** Remove a message handler */
  off(messageType: string, handler: (data: WebSocketMessage) => void) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /** Send a message */
  send(message: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /** Disconnect from WebSocket */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  /** Manually retry connection (resets attempt counter) */
  retry() {
    console.log("[WS] Manual reconnect requested - resetting attempts");
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.connect();
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// Exports
// ============================================================================

/** Singleton WebSocket client */
export const wsClient = new WebSocketClient();

/** Legacy API client for backward compatibility */
export const api = {
  get: <T>(endpoint: string) => apiV1.get<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) => apiV1.post<T>(endpoint, body),
};
