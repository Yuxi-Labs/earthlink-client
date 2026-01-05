import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

interface LegendItem {
  id: string;
  label: string;
  color: string;
  count?: number;
  visible: boolean;
}

interface MapLegendProps {
  onToggleStatus?: (statusId: string, visible: boolean) => void;
}

const STATUS_ITEMS: Omit<LegendItem, "count" | "visible">[] = [
  { id: "idle", label: "Idle", color: "#71717a" },
  { id: "exploring", label: "Exploring", color: "#3b82f6" },
  { id: "learning", label: "Learning", color: "#f59e0b" },
  { id: "interacting", label: "Interacting", color: "#06b6d4" },
  { id: "executing", label: "Executing", color: "#22c55e" },
  { id: "adapting", label: "Adapting", color: "#8b5cf6" },
  { id: "overloaded", label: "Overloaded", color: "#ef4444" },
  { id: "corrupted", label: "Corrupted", color: "#dc2626" },
  { id: "retired", label: "Retired", color: "#52525b" },
];

export function MapLegend({ onToggleStatus }: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(STATUS_ITEMS.map((item) => [item.id, true]))
  );

  const toggleVisibility = (id: string) => {
    const newVisible = !visibility[id];
    setVisibility((prev) => ({ ...prev, [id]: newVisible }));
    onToggleStatus?.(id, newVisible);
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/95 border border-zinc-800 rounded-lg shadow-lg backdrop-blur-sm min-w-[160px]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
      >
        <span>Agent Status</span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>

      {/* Legend Items */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-0.5">
          {STATUS_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-zinc-800/50 group cursor-pointer"
              onClick={() => toggleVisibility(item.id)}
            >
              {/* Status dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                  visibility[item.id] ? "" : "opacity-30"
                }`}
                style={{ backgroundColor: item.color }}
              />
              
              {/* Label */}
              <span
                className={`flex-1 text-[11px] transition-opacity ${
                  visibility[item.id] ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {item.label}
              </span>

              {/* Visibility toggle */}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(item.id);
                }}
              >
                {visibility[item.id] ? (
                  <Eye className="w-3 h-3 text-zinc-500" />
                ) : (
                  <EyeOff className="w-3 h-3 text-zinc-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

