/**
 * MainArea - Rich Desktop Application Main Window
 * 
 * Like Affinity/Photoshop - the main window IS the application,
 * packed with useful panels, tools, and information.
 */

import { useEffect, useState, useMemo } from "react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { wsClient } from "@/lib/api";
import { MapView } from "@/components/map/MapView";
import { TerminalView } from "@/components/terminal/TerminalView";
import { PanelResizeHandle } from "@/components/common/PanelResizeHandle";
import { Tooltip } from "@/components/overlays/Tooltip";
import { useSimulation, useDataFetch } from "@/hooks/useWebSocket";
import {
  openAgentInspector,
  openMetricsDashboard,
  openDataBrowser,
  openComparison,
  openExperimentDesigner,
  openTimeline,
  openSettings,
} from "@/lib/windows";
import {
  Circle,
  RefreshCw,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Brain,
  Route,
  Compass,
  Activity,
  Clock,
  Users,
  TrendingUp,
  Zap,
  Target,
  MessageSquare,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
  Table,
  GitCompare,
  FlaskConical,
  Settings,
  Maximize2,
  Layers,
  Map,
  Globe2,
  Eye,
  EyeOff,
  Gauge,
  AlertTriangle,
} from "lucide-react";

// =============================================================================
// TOOL PALETTE - Quick actions on the left edge
// =============================================================================

function ToolPalette() {
  const { viewMode, setViewMode, showCoverageOverlay, toggleCoverageOverlay, showSignalOverlay, toggleSignalOverlay } = useAppStore();
  
  return (
    <div className="w-10 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-2 gap-1">
      {/* View Mode */}
      <div className="flex flex-col gap-0.5 pb-2 border-b border-zinc-800 mb-2">
        <ToolButton icon={Map} label="2D Map" active={viewMode === "2d"} onClick={() => setViewMode("2d")} />
        <ToolButton icon={Layers} label="2.5D View" active={viewMode === "2.5d"} onClick={() => setViewMode("2.5d")} />
        <ToolButton icon={Globe2} label="3D Globe" active={viewMode === "3d"} onClick={() => setViewMode("3d")} />
      </div>
      
      {/* Overlays */}
      <div className="flex flex-col gap-0.5 pb-2 border-b border-zinc-800 mb-2">
        <ToolButton 
          icon={showCoverageOverlay ? Eye : EyeOff} 
          label="Coverage overlay" 
          active={showCoverageOverlay} 
          onClick={toggleCoverageOverlay} 
        />
        <ToolButton 
          icon={showSignalOverlay ? Eye : EyeOff} 
          label="Signal overlay" 
          active={showSignalOverlay} 
          onClick={toggleSignalOverlay} 
        />
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-col gap-0.5">
        <ToolButton icon={BarChart3} label="Metrics Dashboard" onClick={() => openMetricsDashboard()} />
        <ToolButton icon={Table} label="Data Browser" onClick={() => openDataBrowser()} />
        <ToolButton icon={GitCompare} label="Compare Agents" onClick={() => openComparison()} />
        <ToolButton icon={FlaskConical} label="New Experiment" onClick={() => openExperimentDesigner()} />
      </div>
      
      <div className="flex-1" />
      
      {/* Settings at bottom */}
      <ToolButton icon={Settings} label="Settings" onClick={() => openSettings()} />
    </div>
  );
}

function ToolButton({ icon: Icon, label, active, onClick }: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean; 
  onClick?: () => void;
}) {
  return (
    <Tooltip content={label} position="right">
      <button
        onClick={onClick}
        className={`p-2 rounded transition-colors ${
          active 
            ? "bg-blue-500/20 text-blue-400" 
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        <Icon className="w-4 h-4" />
      </button>
    </Tooltip>
  );
}

// =============================================================================
// LEFT NAVIGATOR - Agent browser with mini-previews
// =============================================================================

interface NavigatorProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onInspect: (id: string) => void;
  onRefresh: () => void;
  isConnected: boolean;
}

function Navigator({ agents, selectedId, onSelect, onInspect, onRefresh, isConnected }: NavigatorProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const s = new Set<string>();
    agents.forEach(a => { if (a.status) s.add(a.status); });
    return Array.from(s).sort();
  }, [agents]);

  const filtered = useMemo(() => {
    let result = agents;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(term) || 
        a.id.toLowerCase().includes(term)
      );
    }
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }
    return result;
  }, [agents, search, statusFilter]);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-2">
        <Tooltip content="Expand agent list" position="right">
          <button 
            onClick={() => setCollapsed(false)}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </Tooltip>
        <div className="mt-2 text-xs text-zinc-600 [writing-mode:vertical-lr] rotate-180">
          {agents.length} agents
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Agents</span>
            <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{agents.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              <span>{isConnected ? "Live" : "Connecting"}</span>
            </div>
          <div className="flex items-center gap-0.5">
            <Tooltip content="Refresh" position="bottom">
              <button onClick={onRefresh} className="p-1 text-zinc-600 hover:text-zinc-400">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Collapse" position="bottom">
              <button onClick={() => setCollapsed(true)} className="p-1 text-zinc-600 hover:text-zinc-400">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="flex items-center gap-1.5 bg-zinc-800/50 rounded px-2 py-1.5 mb-2">
          <Search className="w-3.5 h-3.5 text-zinc-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-600 hover:text-zinc-400">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* Status Filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-1.5 py-0.5 text-[10px] rounded ${
              !statusFilter ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All
          </button>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={`px-1.5 py-0.5 text-[10px] rounded capitalize ${
                statusFilter === s ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
            {agents.length === 0 && !isConnected ? (
              <>
                <Circle className="w-6 h-6 mb-2 animate-pulse" />
                <span className="text-xs">Connecting to backend…</span>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 mb-2" />
                <span className="text-xs">{search || statusFilter ? "No matches" : "No agents yet"}</span>
              </>
            )}
          </div>
        ) : (
          filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedId === agent.id}
              onClick={() => onSelect(selectedId === agent.id ? null : agent.id)}
              onDoubleClick={() => onInspect(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-zinc-500",
  exploring: "bg-emerald-500",
  learning: "bg-amber-500",
  interacting: "bg-cyan-500",
  executing: "bg-green-500",
  adapting: "bg-violet-500",
  overloaded: "bg-red-500",
  corrupted: "bg-red-600",
  retired: "bg-zinc-600",
};

function getMetric(agent: Agent, key: string, fallback: number = 0): number {
  const val = agent.metrics?.[key];
  return typeof val === "number" ? val : fallback;
}

function AgentCard({ agent, isSelected, onClick, onDoubleClick }: { 
  agent: Agent; 
  isSelected: boolean; 
  onClick: () => void; 
  onDoubleClick: () => void;
}) {
  const statusColor = STATUS_COLORS[agent.status || ""] || "bg-zinc-500";
  const knowledge = getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired"));
  const distance = getMetric(agent, "distance_traveled_km");
  const curiosity = getMetric(agent, "curiosity_score");
  
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`px-3 py-2.5 cursor-pointer transition-colors border-l-2 group ${
        isSelected 
          ? "bg-zinc-800/80 border-l-blue-500" 
          : "border-l-transparent hover:bg-zinc-800/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
        <span className="text-sm text-zinc-200 truncate flex-1 font-medium">{agent.name}</span>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Mini metrics */}
      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3" />
          {knowledge.toFixed(0)}
        </span>
        <span className="flex items-center gap-1">
          <Route className="w-3 h-3" />
          {distance.toFixed(0)}km
        </span>
        <span className="flex items-center gap-1">
          <Compass className="w-3 h-3" />
          {(curiosity * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// RIGHT CONTEXT PANEL - Rich details with mini-charts
// =============================================================================

interface ContextPanelProps {
  agent: Agent | null;
  allAgents: Agent[];
  simulationTick: number;
  simulationState: string;
  simulationSpeed: number;
  onClose: () => void;
}

function ContextPanel({ agent, allAgents, simulationTick, simulationState, simulationSpeed, onClose }: ContextPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col items-center py-2">
        <Tooltip content="Expand panel" position="left">
          <button 
            onClick={() => setCollapsed(false)}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {agent ? "Agent Inspector" : "Overview"}
        </span>
        <div className="flex items-center gap-0.5">
          {agent && (
            <>
              <Tooltip content="Open in window" position="bottom">
                <button onClick={() => openAgentInspector(agent.id)} className="p-1 text-zinc-600 hover:text-zinc-400">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Deselect" position="bottom">
                <button onClick={onClose} className="p-1 text-zinc-600 hover:text-zinc-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </>
          )}
          <Tooltip content="Collapse" position="bottom">
            <button onClick={() => setCollapsed(true)} className="p-1 text-zinc-600 hover:text-zinc-400">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {agent ? (
          <AgentDetails agent={agent} />
        ) : (
          <AggregateMetrics 
            agents={allAgents} 
            tick={simulationTick} 
            state={simulationState} 
            speed={simulationSpeed}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t border-zinc-800 flex gap-2">
        <button
          onClick={() => openMetricsDashboard()}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <button
          onClick={() => openDataBrowser()}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
        >
          <Table className="w-3.5 h-3.5" />
          Data
        </button>
      </div>
    </div>
  );
}

function AgentDetails({ agent }: { agent: Agent }) {
  const knowledge = getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired"));
  const distance = getMetric(agent, "distance_traveled_km");
  const curiosity = getMetric(agent, "curiosity_score");
  const goalsActive = getMetric(agent, "goals_active");
  const goalsAchieved = getMetric(agent, "goals_achieved");
  const messagesSent = getMetric(agent, "messages_sent");
  const messagesReceived = getMetric(agent, "messages_received");
  const timeAlive = getMetric(agent, "time_alive_hours");
  const learningRate = getMetric(agent, "learning_rate");
  const stepsExecuted = getMetric(agent, "total_steps_executed");
  const explorationEntropy = getMetric(agent, "exploration_entropy");
  const errorCount = getMetric(agent, "error_count");
  
  const statusColor = STATUS_COLORS[agent.status || ""] || "bg-zinc-500";
  const statusLabel = agent.status ? agent.status.charAt(0).toUpperCase() + agent.status.slice(1) : "Unknown";

  return (
    <div className="space-y-4">
      {/* Identity Card */}
      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />
          <h3 className="text-base font-medium text-zinc-200">{agent.name}</h3>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">{statusLabel}</span>
          <span className="text-zinc-600 font-mono">{agent.id.slice(0, 12)}...</span>
        </div>
      </div>

      {/* Key Metrics - Visual cards */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={Brain} label="Knowledge" value={knowledge.toFixed(0)} color="violet" />
        <MetricCard icon={Route} label="Distance" value={`${distance.toFixed(0)}km`} color="emerald" />
        <MetricCard icon={Compass} label="Curiosity" value={`${(curiosity * 100).toFixed(0)}%`} color="amber" />
        <MetricCard icon={Zap} label="Steps" value={stepsExecuted.toFixed(0)} color="blue" />
      </div>

      {/* Detailed Metrics */}
      <MetricSection title="Goals">
        <MetricRow icon={Target} label="Active" value={goalsActive.toFixed(0)} />
        <MetricRow icon={Target} label="Achieved" value={goalsAchieved.toFixed(0)} />
      </MetricSection>

      <MetricSection title="Communication">
        <MetricRow icon={MessageSquare} label="Sent" value={messagesSent.toFixed(0)} />
        <MetricRow icon={MessageSquare} label="Received" value={messagesReceived.toFixed(0)} />
      </MetricSection>

      <MetricSection title="Learning">
        <MetricRow icon={TrendingUp} label="Rate" value={`${learningRate.toFixed(2)}/hr`} />
        <MetricRow icon={Activity} label="Entropy" value={explorationEntropy.toFixed(2)} />
        <MetricRow icon={Clock} label="Time alive" value={`${timeAlive.toFixed(1)}h`} />
      </MetricSection>

      {errorCount > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4" />
          {errorCount} error{errorCount > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function AggregateMetrics({ agents, tick, state, speed }: { agents: Agent[]; tick: number; state: string; speed: number }) {
  const totalKnowledge = agents.reduce((sum, a) => sum + getMetric(a, "knowledge_items_learned", getMetric(a, "knowledge_acquired")), 0);
  const totalDistance = agents.reduce((sum, a) => sum + getMetric(a, "distance_traveled_km"), 0);
  const avgCuriosity = agents.length > 0 
    ? agents.reduce((sum, a) => sum + getMetric(a, "curiosity_score"), 0) / agents.length 
    : 0;
  const totalGoals = agents.reduce((sum, a) => sum + getMetric(a, "goals_achieved"), 0);
  const totalErrors = agents.reduce((sum, a) => sum + getMetric(a, "error_count"), 0);
  
  const statusCounts = agents.reduce((acc, a) => {
    const s = a.status || "unknown";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stateLabel = state === "stopped" ? "Idle" : state.charAt(0).toUpperCase() + state.slice(1);

  return (
    <div className="space-y-4">
      {/* Simulation State Card */}
      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${state === "running" ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`} />
            <span className="text-sm font-medium text-zinc-300">{stateLabel}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Gauge className="w-3 h-3" />
            {speed}x
          </div>
        </div>
        <div className="text-2xl font-mono text-zinc-200">Tick {tick.toLocaleString()}</div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={Users} label="Agents" value={agents.length.toString()} color="blue" />
        <MetricCard icon={Brain} label="Knowledge" value={totalKnowledge.toFixed(0)} color="violet" />
        <MetricCard icon={Route} label="Distance" value={`${(totalDistance / 1000).toFixed(1)}k`} color="emerald" />
        <MetricCard icon={Target} label="Goals" value={totalGoals.toFixed(0)} color="amber" />
      </div>

      {/* Status Distribution */}
      <MetricSection title="Agent Status">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-zinc-500"}`} />
              <span className="text-xs text-zinc-400 capitalize">{status}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${STATUS_COLORS[status] || "bg-zinc-500"}`}
                  style={{ width: `${(count / agents.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 w-6 text-right">{count}</span>
            </div>
          </div>
        ))}
      </MetricSection>

      <MetricSection title="Collective">
        <MetricRow icon={Compass} label="Avg curiosity" value={`${(avgCuriosity * 100).toFixed(0)}%`} />
      </MetricSection>

      {totalErrors > 0 && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4" />
          {totalErrors} total error{totalErrors > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
  };

  return (
    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] text-zinc-500 uppercase">{label}</span>
      </div>
      <span className="text-lg font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

function MetricSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <span className="text-xs font-medium text-zinc-300">{value}</span>
    </div>
  );
}

// =============================================================================
// BOTTOM TIMELINE
// =============================================================================

interface TimelineProps {
  tick: number;
  isRunning: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (speed: number) => void;
}

function Timeline({ tick, isRunning, speed, onPlay, onPause, onSpeedChange }: TimelineProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="h-8 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={isRunning ? onPause : onPlay}
            className="p-1 text-zinc-500 hover:text-zinc-300"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="text-xs font-mono text-zinc-500">Tick {tick.toLocaleString()}</span>
          <span className="text-xs text-zinc-600">{speed}x</span>
        </div>
        <button onClick={() => setCollapsed(false)} className="p-1 text-zinc-600 hover:text-zinc-400">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-20 border-t border-zinc-800 bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">Timeline</span>
          <button 
            onClick={() => openTimeline()}
            className="p-1 text-zinc-600 hover:text-zinc-400"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
        <button onClick={() => setCollapsed(true)} className="p-1 text-zinc-600 hover:text-zinc-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Controls */}
      <div className="flex-1 flex items-center gap-4 px-3">
        {/* Playback */}
        <div className="flex items-center gap-1">
          <button
            onClick={isRunning ? onPause : onPlay}
            className={`p-2 rounded transition-colors ${
              isRunning 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Speed */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">Speed:</span>
          <div className="flex items-center gap-0.5">
            {[0.5, 1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 text-[10px] rounded ${
                  speed === s
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        
        {/* Scrubber */}
        <div className="flex-1 relative h-2 bg-zinc-800 rounded-full cursor-pointer group">
          <div 
            className="absolute h-full bg-blue-500/30 rounded-full" 
            style={{ width: `${Math.min(100, (tick / 10000) * 100)}%` }} 
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg transition-transform group-hover:scale-110"
            style={{ left: `calc(${Math.min(100, (tick / 10000) * 100)}% - 6px)` }}
          />
        </div>
        
        {/* Tick display */}
        <span className="text-xs font-mono text-zinc-400 min-w-[90px] text-right">
          {tick.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN AREA
// =============================================================================

export function MainArea() {
  const {
    agents,
    connectionStatus,
    simulationState,
    simulationTick,
    simulationSpeed,
    selectedAgentId,
    selectAgent,
    showTerminal,
    toggleTerminal,
    setSimulationSpeed,
  } = useAppStore();

  const { start, pause, fetchStatus } = useSimulation();
  const { fetchAgents } = useDataFetch();
  const isConnected = connectionStatus === "connected";
  const isRunning = simulationState === "running";

  const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

  const [terminalHeight, setTerminalHeight] = useState(180);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Tool Palette */}
      <ToolPalette />
      
      {/* Navigator */}
      <Navigator
        agents={agents}
        selectedId={selectedAgentId}
        onSelect={selectAgent}
        onInspect={(id) => openAgentInspector(id)}
        onRefresh={fetchAgents}
        isConnected={isConnected}
      />

      {/* Center Canvas + Timeline */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map Canvas */}
        <div className="flex-1 overflow-hidden bg-zinc-950 relative">
          {isConnected ? (
            <MapView />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Circle className={`w-12 h-12 text-zinc-700 mb-4 ${connectionStatus === "connecting" ? "animate-pulse" : ""}`} />
              <p className="text-sm text-zinc-500 mb-3">
                {connectionStatus === "connecting" ? "Connecting to backend..." : "Disconnected"}
              </p>
              <button
                onClick={() => wsClient.retry()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <Timeline
          tick={simulationTick}
          isRunning={isRunning}
          speed={simulationSpeed}
          onPlay={start}
          onPause={pause}
          onSpeedChange={setSimulationSpeed}
        />

        {/* Terminal (optional) */}
        {showTerminal && (
          <>
            <PanelResizeHandle
              orientation="horizontal"
              onResize={delta => setTerminalHeight(h => Math.min(Math.max(h - delta, 100), 400))}
            />
            <div className="border-t border-zinc-800 bg-zinc-900" style={{ height: terminalHeight }}>
              <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wide">Terminal</span>
                </div>
                <button onClick={toggleTerminal} className="p-1 text-zinc-600 hover:text-zinc-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-[calc(100%-28px)] overflow-hidden">
                <TerminalView />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Context Panel */}
      <ContextPanel
        agent={selectedAgent || null}
        allAgents={agents}
        simulationTick={simulationTick}
        simulationState={simulationState}
        simulationSpeed={simulationSpeed}
        onClose={() => selectAgent(null)}
      />
    </div>
  );
}
