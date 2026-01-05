import { useState, useRef, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { Play, Pause, SkipBack, Rewind, FastForward, Clock, Bookmark } from "lucide-react";
import { Tooltip } from "@/components/overlays/Tooltip";

interface BookmarkItem {
  tick: number;
  label: string;
  color?: string;
}

export function TimelineScrubber() {
  const {
    simulationTick,
    simulationState,
    simulationSpeed,
    startSimulation,
    pauseSimulation,
    setSimulationSpeed,
  } = useAppStore();

  const [hoverTick, setHoverTick] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  // For demo, max tick is current tick (can't go forward in time)
  const maxTick = simulationTick;
  const minTick = 0;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const tick = Math.round(minTick + percent * (maxTick - minTick));
      setHoverTick(tick);
    },
    [maxTick, minTick]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const tick = Math.round(minTick + percent * (maxTick - minTick));
      // TODO: Jump to tick (requires backend support)
      console.log("Jump to tick:", tick);
    },
    [maxTick, minTick]
  );

  const addBookmark = () => {
    setBookmarks((prev) => [
      ...prev,
      { tick: simulationTick, label: `Tick ${simulationTick}` },
    ]);
  };

  const progress = maxTick > 0 ? (simulationTick / maxTick) * 100 : 0;

  const speedOptions = [0.25, 0.5, 1, 2, 4, 8];

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900 border-t border-zinc-800">
      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <Tooltip content="Reset to start">
          <button
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
            onClick={() => console.log("Reset to start")}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {simulationState === "running" ? (
          <Tooltip content="Pause (F6)">
            <button
              onClick={pauseSimulation}
              className="p-1.5 text-zinc-300 bg-zinc-800 rounded transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Play (F5)">
            <button
              onClick={startSimulation}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Current tick */}
      <div className="flex items-center gap-1.5 min-w-[80px]">
        <Clock className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-xs font-mono text-zinc-400">
          {simulationTick.toLocaleString()}
        </span>
      </div>

      {/* Timeline track */}
      <div className="flex-1 relative">
        <div
          ref={trackRef}
          className="h-6 flex items-center cursor-pointer group"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTick(null)}
          onClick={handleClick}
        >
          {/* Track background */}
          <div className="absolute inset-x-0 h-1 bg-zinc-800 rounded-full">
            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            
            {/* Bookmarks */}
            {bookmarks.map((bm, i) => {
              const pos = maxTick > 0 ? (bm.tick / maxTick) * 100 : 0;
              return (
                <Tooltip key={i} content={bm.label}>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-amber-500 rounded-sm cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${pos}%` }}
                  />
                </Tooltip>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-900 shadow-lg transition-all"
            style={{ left: `calc(${progress}% - 6px)` }}
          />

          {/* Hover indicator */}
          {hoverTick !== null && (
            <div
              className="absolute -top-6 px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300 pointer-events-none whitespace-nowrap"
              style={{
                left: `${maxTick > 0 ? (hoverTick / maxTick) * 100 : 0}%`,
                transform: "translateX(-50%)",
              }}
            >
              Tick {hoverTick.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-1">
        <Tooltip content="Slow down">
          <button
            onClick={() => {
              const idx = speedOptions.indexOf(simulationSpeed);
              if (idx > 0) setSimulationSpeed(speedOptions[idx - 1]);
            }}
            disabled={simulationSpeed <= speedOptions[0]}
            className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <span className="min-w-[40px] text-center text-xs font-mono text-zinc-400">
          {simulationSpeed}x
        </span>

        <Tooltip content="Speed up">
          <button
            onClick={() => {
              const idx = speedOptions.indexOf(simulationSpeed);
              if (idx < speedOptions.length - 1) setSimulationSpeed(speedOptions[idx + 1]);
            }}
            disabled={simulationSpeed >= speedOptions[speedOptions.length - 1]}
            className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>

      {/* Bookmark button */}
      <Tooltip content="Add bookmark at current tick">
        <button
          onClick={addBookmark}
          className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}

