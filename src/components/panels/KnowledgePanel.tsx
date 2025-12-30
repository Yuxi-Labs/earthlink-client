/**
 * Knowledge Acquisition Panel
 * 
 * Shows timeline of what agents have learned:
 * - WHAT: topic, source, knowledge count
 * - WHEN: timestamp
 * - WHY: goal context, curiosity signal
 * - WHERE: lat/lon
 * - QUALITY: relevance, novelty scores
 */

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Clock, 
  MapPin, 
  Sparkles, 
  Target,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useKnowledgeAnalytics } from "@/hooks/useExplorer";

interface KnowledgeItemProps {
  acquisition: {
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
  };
}

function KnowledgeItem({ acquisition }: KnowledgeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { what, when, why, where, quality } = acquisition;
  
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "just now";
  };

  const getSourceColor = (source: string) => {
    if (source.includes("wikipedia")) return "text-blue-400";
    if (source.includes("osm") || source.includes("openstreetmap")) return "text-green-400";
    if (source.includes("reddit")) return "text-orange-400";
    if (source.includes("duckduckgo")) return "text-yellow-400";
    return "text-[var(--color-text-muted)]";
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-[var(--color-text-muted)]";
    if (score >= 0.8) return "text-[var(--color-success)]";
    if (score >= 0.5) return "text-[var(--color-warning)]";
    return "text-[var(--color-error)]";
  };

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-start gap-3 px-3 py-2.5 bg-[var(--color-bg-tertiary)] cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <BookOpen className="w-4 h-4 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">
              {what.topic}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
              +{what.knowledge_count}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${getSourceColor(what.source)}`}>
              {what.source}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              • {timeAgo(when)}
            </span>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 py-2 border-t border-[var(--color-border-subtle)] space-y-2 text-xs">
          {/* Summary */}
          {what.content_summary && (
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {what.content_summary}
            </p>
          )}

          {/* Why */}
          {why.goal_context && (
            <div className="flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-[var(--color-accent)] mt-0.5" />
              <span className="text-[var(--color-text-muted)]">
                Goal: {why.goal_context}
              </span>
            </div>
          )}

          {/* Curiosity */}
          {why.curiosity_signal !== null && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[var(--color-text-muted)]">
                Curiosity: {(why.curiosity_signal * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Where */}
          {where.lat !== null && where.lon !== null && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-[var(--color-text-muted)]">
                {where.lat.toFixed(4)}, {where.lon.toFixed(4)}
              </span>
            </div>
          )}

          {/* Quality Scores */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1">
              <span className="text-[var(--color-text-muted)]">Relevance:</span>
              <span className={getScoreColor(quality.relevance_score)}>
                {quality.relevance_score !== null ? `${(quality.relevance_score * 100).toFixed(0)}%` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[var(--color-text-muted)]">Novelty:</span>
              <span className={getScoreColor(quality.novelty_score)}>
                {quality.novelty_score !== null ? `${(quality.novelty_score * 100).toFixed(0)}%` : "—"}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(when).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function KnowledgePanel() {
  const [hours, setHours] = useState(24);
  const { acquisitions, total, loading, error, fetchAcquisitions } = useKnowledgeAnalytics();

  // Fetch on mount
  useEffect(() => {
    fetchAcquisitions({ hours, limit: 50 });
  }, [hours, fetchAcquisitions]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <BookOpen className="w-4 h-4" />
          <span>Knowledge</span>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Time filter */}
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-secondary)]"
          >
            <option value={1}>Last hour</option>
            <option value={6}>Last 6h</option>
            <option value={24}>Last 24h</option>
            <option value={48}>Last 48h</option>
            <option value={168}>Last week</option>
          </select>
          <button 
            onClick={() => fetchAcquisitions({ hours, limit: 50 })}
            disabled={loading}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <div className="text-center py-4 text-sm text-[var(--color-error)]">
            {error}
          </div>
        )}

        {!error && acquisitions.length === 0 && !loading && (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No knowledge acquired yet
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Agents will learn as they explore
            </p>
          </div>
        )}

        <div className="space-y-2">
          {acquisitions.map((acq) => (
            <KnowledgeItem key={acq.id} acquisition={acq} />
          ))}
        </div>

        {loading && acquisitions.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-[var(--color-text-muted)] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
