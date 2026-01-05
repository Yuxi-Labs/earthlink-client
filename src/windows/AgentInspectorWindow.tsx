/**
 * Agent Inspector Window
 * 
 * Deep dive on a single agent with:
 * - Real-time metrics charts
 * - Learning curve visualization
 * - Goal hierarchy tree
 * - Memory browser
 * - Decision trace log
 * - Parameter controls (curiosity, learning rate, etc.)
 */

import { useEffect, useState } from "react";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";
import {
  Brain,
  Route,
  Target,
  Compass,
  Activity,
  Clock,
  MessageSquare,
  Zap,
  TrendingUp,
  Settings,
  History,
  Database,
  GitBranch,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAppStore, type Agent } from "@/stores/appStore";
import { useDataFetch } from "@/hooks/useWebSocket";
import "@/App.css";

interface AgentInspectorWindowProps {
  agentId?: string;
}

function getMetric(agent: Agent | null, key: string, fallback: number = 0): number {
  if (!agent) return fallback;
  const val = agent.metrics?.[key];
  return typeof val === "number" ? val : fallback;
}

const STATUS_COLORS: Record<string, string> = {
  idle: "#71717a",
  exploring: "#10b981",
  learning: "#f59e0b",
  interacting: "#06b6d4",
  executing: "#22c55e",
  adapting: "#8b5cf6",
  overloaded: "#ef4444",
  corrupted: "#dc2626",
  retired: "#52525b",
};

export function AgentInspectorWindow({ agentId }: AgentInspectorWindowProps) {
  const { agents, simulationTick, simulationState } = useAppStore();
  const { fetchAgents } = useDataFetch();
  const [activeTab, setActiveTab] = useState<"overview" | "learning" | "goals" | "memory" | "decisions" | "parameters">("overview");
  const [historyData, setHistoryData] = useState<Array<{ tick: number; knowledge: number; curiosity: number; reward: number; distance: number }>>([]);
  
  const agent = agents.find(a => a.id === agentId) || null;
  
  // Simulate history data accumulation
  useEffect(() => {
    if (!agent) return;
    
    const interval = setInterval(() => {
      setHistoryData(prev => {
        const newPoint = {
          tick: simulationTick,
          knowledge: getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired")),
          curiosity: getMetric(agent, "curiosity_score") * 100,
          reward: getMetric(agent, "total_reward", 0),
          distance: getMetric(agent, "distance_traveled_km"),
        };
        const updated = [...prev, newPoint].slice(-100); // Keep last 100 points
        return updated;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [agent, simulationTick]);
  
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  if (!agent) {
    return (
      <div className="h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">Agent not found</p>
          <p className="text-zinc-600 text-sm mt-2">ID: {agentId || "none"}</p>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[agent.status || "idle"];
  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "learning", label: "Learning", icon: TrendingUp },
    { id: "goals", label: "Goals", icon: Target },
    { id: "memory", label: "Memory", icon: Database },
    { id: "decisions", label: "Decisions", icon: GitBranch },
    { id: "parameters", label: "Parameters", icon: Settings },
  ] as const;

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: statusColor }}
            />
            <div>
              <h1 className="text-lg font-semibold">{agent.name}</h1>
              <p className="text-xs text-zinc-500 font-mono">{agent.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {simulationState === "running" ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              ) : (
                "Paused"
              )}
            </span>
            <button 
              onClick={() => fetchAgents()}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 px-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "overview" && <OverviewTab agent={agent} historyData={historyData} />}
        {activeTab === "learning" && <LearningTab agent={agent} historyData={historyData} />}
        {activeTab === "goals" && <GoalsTab agent={agent} />}
        {activeTab === "memory" && <MemoryTab agent={agent} />}
        {activeTab === "decisions" && <DecisionsTab agent={agent} />}
        {activeTab === "parameters" && <ParametersTab agent={agent} />}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ agent, historyData }: { agent: Agent; historyData: Array<{ tick: number; knowledge: number; curiosity: number; reward: number; distance: number }> }) {
  const knowledge = getMetric(agent, "knowledge_items_learned", getMetric(agent, "knowledge_acquired"));
  const distance = getMetric(agent, "distance_traveled_km");
  const curiosity = getMetric(agent, "curiosity_score");
  const goalsActive = getMetric(agent, "goals_active");
  const goalsAchieved = getMetric(agent, "goals_achieved");
  const messagesSent = getMetric(agent, "messages_sent");
  const messagesReceived = getMetric(agent, "messages_received");
  const timeAlive = getMetric(agent, "time_alive_hours");
  const stepsExecuted = getMetric(agent, "total_steps_executed");

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Brain} label="Knowledge" value={knowledge.toFixed(0)} color="violet" />
        <MetricCard icon={Route} label="Distance" value={`${distance.toFixed(1)} km`} color="emerald" />
        <MetricCard icon={Compass} label="Curiosity" value={`${(curiosity * 100).toFixed(0)}%`} color="amber" />
        <MetricCard icon={Zap} label="Steps" value={stepsExecuted.toFixed(0)} color="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Knowledge Over Time">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Area type="monotone" dataKey="knowledge" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Curiosity Over Time">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Line type="monotone" dataKey="curiosity" stroke="#f59e0b" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity & Social */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Activity</h3>
          <div className="space-y-2">
            <MetricRow icon={Clock} label="Time alive" value={`${timeAlive.toFixed(1)} hours`} />
            <MetricRow icon={Target} label="Goals active" value={goalsActive.toFixed(0)} />
            <MetricRow icon={Target} label="Goals achieved" value={goalsAchieved.toFixed(0)} />
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Communication</h3>
          <div className="space-y-2">
            <MetricRow icon={MessageSquare} label="Messages sent" value={messagesSent.toFixed(0)} />
            <MetricRow icon={MessageSquare} label="Messages received" value={messagesReceived.toFixed(0)} />
            <MetricRow icon={Activity} label="Interactions" value={getMetric(agent, "agents_encountered").toFixed(0)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEARNING TAB
// ============================================================================

function LearningTab({ agent, historyData }: { agent: Agent; historyData: Array<{ tick: number; knowledge: number; curiosity: number; reward: number; distance: number }> }) {
  const learningRate = getMetric(agent, "learning_rate");
  const knowledgeDiversity = getMetric(agent, "knowledge_diversity");
  const predictionAccuracy = getMetric(agent, "prediction_accuracy");
  const explorationEntropy = getMetric(agent, "exploration_entropy");

  return (
    <div className="space-y-6">
      {/* Learning Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Learning Rate" value={`${learningRate.toFixed(2)}/hr`} color="emerald" />
        <MetricCard icon={Brain} label="Knowledge Diversity" value={`${(knowledgeDiversity * 100).toFixed(0)}%`} color="violet" />
        <MetricCard icon={Target} label="Prediction Acc." value={`${(predictionAccuracy * 100).toFixed(0)}%`} color="blue" />
        <MetricCard icon={Compass} label="Exploration Entropy" value={explorationEntropy.toFixed(2)} color="amber" />
      </div>

      {/* Learning Curve */}
      <ChartCard title="Learning Curve (Knowledge Acquisition)">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "Simulation Tick", position: "bottom", fill: "#71717a" }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "Knowledge Items", angle: -90, position: "left", fill: "#71717a" }} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Area type="monotone" dataKey="knowledge" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Knowledge" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Reward History */}
      <ChartCard title="Reward History">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="tick" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Line type="monotone" dataKey="reward" stroke="#3b82f6" dot={false} name="Total Reward" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ============================================================================
// GOALS TAB
// ============================================================================

function GoalsTab({ agent }: { agent: Agent }) {
  const goalsActive = getMetric(agent, "goals_active");
  const goalsAchieved = getMetric(agent, "goals_achieved");
  const goalPersistence = getMetric(agent, "goal_persistence");

  // Mock goal hierarchy - in real app, this comes from backend
  const mockGoals = [
    { id: "1", name: "Explore Australian Coast", status: "active", progress: 65, children: [
      { id: "1.1", name: "Visit Sydney region", status: "completed", progress: 100 },
      { id: "1.2", name: "Explore Great Barrier Reef area", status: "active", progress: 40 },
      { id: "1.3", name: "Map coastal knowledge", status: "pending", progress: 0 },
    ]},
    { id: "2", name: "Learn about local ecosystems", status: "active", progress: 30, children: [
      { id: "2.1", name: "Query Wikipedia on Australian fauna", status: "completed", progress: 100 },
      { id: "2.2", name: "Integrate knowledge with world model", status: "active", progress: 20 },
    ]},
  ];

  return (
    <div className="space-y-6">
      {/* Goal Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard icon={Target} label="Active Goals" value={goalsActive.toFixed(0)} color="blue" />
        <MetricCard icon={Target} label="Achieved" value={goalsAchieved.toFixed(0)} color="emerald" />
        <MetricCard icon={Activity} label="Persistence" value={`${(goalPersistence * 100).toFixed(0)}%`} color="violet" />
      </div>

      {/* Goal Hierarchy */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Goal Hierarchy</h3>
        <div className="space-y-3">
          {mockGoals.map(goal => (
            <GoalItem key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalItem({ goal, depth = 0 }: { goal: { id: string; name: string; status: string; progress: number; children?: Array<{ id: string; name: string; status: string; progress: number }> }; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = goal.children && goal.children.length > 0;

  const statusColors = {
    active: "text-blue-400 bg-blue-500/10",
    completed: "text-emerald-400 bg-emerald-500/10",
    pending: "text-zinc-500 bg-zinc-500/10",
  };

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div className="flex items-center gap-2 py-1.5">
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-zinc-500 hover:text-zinc-300">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[goal.status as keyof typeof statusColors]}`}>
          {goal.status}
        </span>
        <span className="text-sm text-zinc-300 flex-1">{goal.name}</span>
        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all" 
            style={{ width: `${goal.progress}%` }} 
          />
        </div>
        <span className="text-xs text-zinc-500 w-10 text-right">{goal.progress}%</span>
      </div>
      {hasChildren && expanded && (
        <div className="mt-1">
          {goal.children!.map(child => (
            <GoalItem key={child.id} goal={{ ...child, children: undefined }} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MEMORY TAB
// ============================================================================

function MemoryTab({ agent }: { agent: Agent }) {
  const memoryEntries = getMetric(agent, "memory_entries");
  const [selectedType, setSelectedType] = useState<"all" | "episodic" | "semantic" | "procedural">("all");

  // Mock memory entries
  const mockMemories = [
    { id: "1", type: "episodic", content: "Visited Sydney at tick 1234", timestamp: "2h ago", importance: 0.8 },
    { id: "2", type: "semantic", content: "Australia has 6 states and 2 territories", timestamp: "1h ago", importance: 0.9 },
    { id: "3", type: "procedural", content: "Navigate using curiosity-driven exploration", timestamp: "30m ago", importance: 0.7 },
    { id: "4", type: "episodic", content: "Encountered agent A2 near Melbourne", timestamp: "15m ago", importance: 0.6 },
    { id: "5", type: "semantic", content: "Great Barrier Reef is a World Heritage site", timestamp: "10m ago", importance: 0.85 },
  ];

  const filteredMemories = selectedType === "all" 
    ? mockMemories 
    : mockMemories.filter(m => m.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Memory Stats */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Database} label="Total Entries" value={memoryEntries.toFixed(0)} color="violet" />
        <MetricCard icon={History} label="Episodic" value="234" color="blue" />
        <MetricCard icon={Brain} label="Semantic" value="156" color="emerald" />
        <MetricCard icon={Settings} label="Procedural" value="45" color="amber" />
      </div>

      {/* Memory Browser */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Memory Browser</h3>
          <div className="flex gap-1">
            {["all", "episodic", "semantic", "procedural"].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type as typeof selectedType)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedType === type 
                    ? "bg-blue-500 text-white" 
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2 max-h-80 overflow-auto">
          {filteredMemories.map(memory => (
            <div key={memory.id} className="p-3 rounded bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  memory.type === "episodic" ? "bg-blue-500/20 text-blue-400" :
                  memory.type === "semantic" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-amber-500/20 text-amber-400"
                }`}>
                  {memory.type}
                </span>
                <span className="text-xs text-zinc-600">{memory.timestamp}</span>
              </div>
              <p className="text-sm text-zinc-300">{memory.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-zinc-500">Importance:</span>
                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500" 
                    style={{ width: `${memory.importance * 100}%` }} 
                  />
                </div>
                <span className="text-xs text-zinc-400">{(memory.importance * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DECISIONS TAB
// ============================================================================

function DecisionsTab({ agent }: { agent: Agent }) {
  const decisionDistribution = agent.metrics?.decision_distribution as Record<string, number> | undefined;

  // Mock decision log
  const mockDecisions = [
    { tick: 1250, action: "move", reasoning: "High curiosity signal from unexplored region", confidence: 0.85 },
    { tick: 1248, action: "learn", reasoning: "Wikipedia query about local geography", confidence: 0.92 },
    { tick: 1245, action: "interact", reasoning: "Nearby agent has relevant knowledge", confidence: 0.78 },
    { tick: 1240, action: "move", reasoning: "Following exploration gradient", confidence: 0.88 },
    { tick: 1235, action: "learn", reasoning: "Integrating new information into world model", confidence: 0.95 },
  ];

  const distributionData = decisionDistribution 
    ? Object.entries(decisionDistribution).map(([name, value]) => ({ name, value }))
    : [
        { name: "move", value: 45 },
        { name: "learn", value: 35 },
        { name: "interact", value: 15 },
        { name: "other", value: 5 },
      ];

  return (
    <div className="space-y-6">
      {/* Decision Distribution */}
      <ChartCard title="Decision Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distributionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#71717a", fontSize: 10 }} width={80} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Decision Log */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Recent Decisions</h3>
        <div className="space-y-3 max-h-80 overflow-auto">
          {mockDecisions.map((decision, i) => (
            <div key={i} className="p-3 rounded bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500">T{decision.tick}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    decision.action === "move" ? "bg-emerald-500/20 text-emerald-400" :
                    decision.action === "learn" ? "bg-violet-500/20 text-violet-400" :
                    "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {decision.action.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  Confidence: {(decision.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-zinc-300">{decision.reasoning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PARAMETERS TAB
// ============================================================================

function ParametersTab({ agent: _agent }: { agent: Agent }) {
  const [curiosityWeight, setCuriosityWeight] = useState(0.7);
  const [learningRate, setLearningRate] = useState(0.01);
  const [explorationBias, setExplorationBias] = useState(0.6);
  const [rewardDiscount, setRewardDiscount] = useState(0.99);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Agent Parameters</h3>
        <p className="text-xs text-zinc-600 mb-4">
          Adjust parameters to study how they affect agent behavior. Changes take effect on next tick.
        </p>
        
        <div className="space-y-6">
          <ParameterSlider
            label="Curiosity Weight"
            value={curiosityWeight}
            onChange={setCuriosityWeight}
            min={0}
            max={1}
            step={0.01}
            description="How much intrinsic curiosity drives exploration vs. goal-directed behavior"
          />
          
          <ParameterSlider
            label="Learning Rate"
            value={learningRate}
            onChange={setLearningRate}
            min={0.001}
            max={0.1}
            step={0.001}
            description="Speed of neural network weight updates"
          />
          
          <ParameterSlider
            label="Exploration Bias"
            value={explorationBias}
            onChange={setExplorationBias}
            min={0}
            max={1}
            step={0.01}
            description="Preference for exploring unknown areas vs. exploiting known rewards"
          />
          
          <ParameterSlider
            label="Reward Discount (γ)"
            value={rewardDiscount}
            onChange={setRewardDiscount}
            min={0.8}
            max={0.999}
            step={0.001}
            description="How much future rewards are discounted in decision making"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-800">
          <button className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Reset to Defaults
          </button>
          <button className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ParameterSlider({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  description 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  min: number; 
  max: number; 
  step: number; 
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-zinc-300">{label}</label>
        <span className="text-sm font-mono text-zinc-400">{value.toFixed(step < 0.01 ? 3 : 2)}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <p className="text-xs text-zinc-600 mt-1">{description}</p>
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colorClasses = {
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
  };

  return (
    <div className={`p-4 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border border-zinc-800`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <span className="text-2xl font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-sm text-zinc-500">{label}</span>
      </div>
      <span className="text-sm text-zinc-300">{value}</span>
    </div>
  );
}

