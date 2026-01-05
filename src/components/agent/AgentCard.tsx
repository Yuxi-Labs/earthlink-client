/**
 * AgentCard - Rich floating agent info card
 */

import { useState } from "react";
import { 
  Brain, 
  Zap, 
  Route, 
  MessageCircle, 
  ChevronDown, 
  ChevronRight,
  Target,
  Activity,
  X,
  Pin,
  PinOff,
} from "lucide-react";
import { MiniProgress, VerticalMeter } from "@/components/metrics/MetricsDial";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    status: string;
    metrics: Record<string, unknown>;
  };
  isPinned?: boolean;
  onPin?: () => void;
  onClose?: () => void;
  onFollow?: () => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  idle: "#71717a",
  exploring: "#3b82f6",
  learning: "#f59e0b",
  interacting: "#06b6d4",
  executing: "#22c55e",
  adapting: "#8b5cf6",
  overloaded: "#ef4444",
  corrupted: "#dc2626",
  retired: "#52525b",
};

export function AgentCard({ 
  agent, 
  isPinned = false, 
  onPin, 
  onClose, 
  onFollow,
  compact = false 
}: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;
  const metrics = agent.metrics || {};
  
  const knowledge = Number(metrics.knowledge_items_learned || 0);
  const curiosity = Number(metrics.curiosity_score || 0.5) * 100;
  const distance = Number(metrics.distance_traveled_km || 0);
  const reward = Number(metrics.total_reward || 0);
  const messages = Number(metrics.messages_sent || 0);
  const actions = Number(metrics.total_steps_executed || 0);

  if (compact) {
    return (
      <div 
        className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-lg p-2 shadow-lg hover:border-zinc-600 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
          />
          <span className="text-xs font-medium text-zinc-200 flex-1">{agent.name}</span>
          <span className="text-[10px] text-zinc-500">{knowledge} K</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/30">
        <div
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{agent.name}</p>
          <p className="text-[10px] text-zinc-500 capitalize">{agent.status}</p>
        </div>
        <div className="flex items-center gap-1">
          {onFollow && (
            <button
              onClick={onFollow}
              className="p-1 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-700/50 rounded transition-colors"
              title="Follow Agent"
            >
              <Target className="w-3.5 h-3.5" />
            </button>
          )}
          {onPin && (
            <button
              onClick={onPin}
              className={`p-1 hover:bg-zinc-700/50 rounded transition-colors ${isPinned ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"}`}
              title={isPinned ? "Unpin" : "Pin"}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick meters */}
      <div className="flex justify-around py-3 px-2 border-b border-zinc-800/50">
        <VerticalMeter value={curiosity} max={100} label="Curiosity" color="#f59e0b" height={50} />
        <VerticalMeter value={Math.min(knowledge, 100)} max={100} label="Knowledge" color="#3b82f6" height={50} />
        <VerticalMeter value={Math.min(reward * 10, 100)} max={100} label="Reward" color="#22c55e" height={50} />
        <VerticalMeter value={Math.min(actions / 10, 100)} max={100} label="Activity" color="#8b5cf6" height={50} />
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
      >
        <span>Details</span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-[10px]">
              <Route className="w-3 h-3 text-green-400" />
              <span className="text-zinc-500">Distance</span>
              <span className="text-zinc-200 ml-auto font-mono">{distance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <MessageCircle className="w-3 h-3 text-cyan-400" />
              <span className="text-zinc-500">Messages</span>
              <span className="text-zinc-200 ml-auto font-mono">{messages}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Brain className="w-3 h-3 text-blue-400" />
              <span className="text-zinc-500">Knowledge</span>
              <span className="text-zinc-200 ml-auto font-mono">{knowledge}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-zinc-500">Reward</span>
              <span className="text-zinc-200 ml-auto font-mono">{reward.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <MiniProgress value={curiosity} label="Curiosity" color="#f59e0b" />
            <MiniProgress value={Number(metrics.prediction_accuracy || 0) * 100} label="Prediction" color="#8b5cf6" />
            <MiniProgress value={Number(metrics.decision_accuracy || 0) * 100} label="Decision" color="#22c55e" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact HUD-style agent indicator
 */
interface AgentHUDIndicatorProps {
  agents: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  onSelect?: (id: string) => void;
}

export function AgentHUDIndicator({ agents, onSelect }: AgentHUDIndicatorProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900/80 backdrop-blur-sm rounded-full border border-zinc-700/50">
      <Activity className="w-3 h-3 text-zinc-500" />
      <span className="text-[10px] text-zinc-400">{agents.length}</span>
      <div className="flex -space-x-1 ml-1">
        {agents.slice(0, 5).map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect?.(agent.id)}
            className="w-4 h-4 rounded-full border border-zinc-800 hover:scale-125 transition-transform"
            style={{ backgroundColor: STATUS_COLORS[agent.status] || STATUS_COLORS.idle }}
            title={agent.name}
          />
        ))}
        {agents.length > 5 && (
          <div className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center">
            <span className="text-[8px] text-zinc-300">+{agents.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
}

