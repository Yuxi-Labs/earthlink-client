/**
 * Target Worlds Panel
 * 
 * Shows deployment destinations for trained agents:
 * - World name, type, description
 * - Region info
 * - Complexity level
 * - Agent readiness for each world
 */

import { useState, useEffect } from "react";
import { 
  Globe2, 
  MapPin, 
  Layers, 
  Target,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useTargetWorlds, useReadiness } from "@/hooks/useExplorer";
import { useAppStore } from "@/stores/appStore";
import { type TargetWorld } from "@/lib/api";

interface WorldCardProps {
  world: TargetWorld;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function WorldCard({ world, isSelected, onSelect }: WorldCardProps) {
  const getComplexityColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "text-[var(--color-text-muted)]";
    if (score < 0.3) return "text-[var(--color-success)]";
    if (score < 0.6) return "text-[var(--color-warning)]";
    return "text-[var(--color-error)]";
  };

  const getComplexityLabel = (score: number | null | undefined) => {
    if (score === null || score === undefined) return null;
    if (score < 0.3) return "Easy";
    if (score < 0.6) return "Medium";
    return "Hard";
  };

  const getTypeIcon = (type: string | undefined) => {
    if (!type) return <Globe2 className="w-4 h-4" />;
    if (type.includes("earth") || type.includes("region")) return <MapPin className="w-4 h-4" />;
    if (type.includes("virtual") || type.includes("game")) return <Layers className="w-4 h-4" />;
    return <Globe2 className="w-4 h-4" />;
  };

  const complexityLabel = getComplexityLabel(world.complexity_score);

  return (
    <div 
      onClick={() => onSelect(world.id)}
      className={`p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" 
          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isSelected ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"}`}>
          {getTypeIcon(world.world_type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-[var(--color-text-primary)] truncate">
              {world.name}
            </h4>
            <ChevronRight className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isSelected ? "rotate-90" : ""}`} />
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs">
            {world.world_type && (
              <span className="text-[var(--color-text-muted)]">
                {world.world_type}
              </span>
            )}
            {complexityLabel && (
              <span className={getComplexityColor(world.complexity_score)}>
                • {complexityLabel}
              </span>
            )}
          </div>

          {world.description && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
              {world.description}
            </p>
          )}
        </div>
      </div>

      {isSelected && world.region_code && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <MapPin className="w-3.5 h-3.5" />
            <span>Region: {world.region_code}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface AgentWorldReadinessProps {
  agentId: string;
  worldId: string;
}

function AgentWorldReadiness({ agentId, worldId }: AgentWorldReadinessProps) {
  const { readiness, loading, calculateReadiness } = useReadiness();
  
  useEffect(() => {
    calculateReadiness(agentId, worldId);
  }, [agentId, worldId, calculateReadiness]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        Calculating...
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <AlertCircle className="w-3.5 h-3.5" />
        Not evaluated
      </div>
    );
  }

  const score = readiness.readiness_score || 0;
  const isReady = readiness.is_ready || false;

  return (
    <div className="flex items-center gap-2">
      {isReady ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-[var(--color-warning)]" />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className={isReady ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>
            {(score * 100).toFixed(0)}% Ready
          </span>
        </div>
        <div className="h-1 bg-[var(--color-bg-tertiary)] rounded-full mt-1 overflow-hidden">
          <div 
            className={`h-full rounded-full ${isReady ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]"}`}
            style={{ width: `${score * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function TargetWorldsPanel() {
  const { worlds, loading, error, fetchWorlds } = useTargetWorlds();
  const { selectedAgentId } = useAppStore();
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <Target className="w-4 h-4" />
          <span>Target Worlds</span>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
            {worlds.length}
          </span>
        </div>
        <button 
          onClick={() => fetchWorlds()}
          disabled={loading}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <div className="text-center py-4 text-sm text-[var(--color-error)]">
            {error}
          </div>
        )}

        {!error && worlds.length === 0 && !loading && (
          <div className="text-center py-8">
            <Globe2 className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No target worlds defined
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Target worlds are deployment destinations for trained agents
            </p>
          </div>
        )}

        <div className="space-y-2">
          {worlds.map((world) => (
            <div key={world.id}>
              <WorldCard 
                world={world} 
                isSelected={selectedWorldId === world.id}
                onSelect={setSelectedWorldId}
              />
              
              {/* Show agent readiness when world is selected and an agent is selected */}
              {selectedWorldId === world.id && selectedAgentId && (
                <div className="mt-2 p-2 bg-[var(--color-bg-tertiary)] rounded text-xs">
                  <div className="text-[var(--color-text-muted)] mb-1">
                    Agent Readiness for this world:
                  </div>
                  <AgentWorldReadiness 
                    agentId={selectedAgentId} 
                    worldId={world.id} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && worlds.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-[var(--color-text-muted)] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
