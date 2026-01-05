/**
 * Timeline Window
 * 
 * Full timeline view with history, playback, and annotations
 */

import { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Flag,
  Bookmark,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "@/App.css";

export function TimelineWindow() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTick, setCurrentTick] = useState(5000);
  const [zoom, setZoom] = useState(1);
  const maxTick = 10000;

  // Mock events/annotations
  const events = [
    { tick: 1000, type: "milestone", label: "First agent spawned" },
    { tick: 2500, type: "milestone", label: "Agent A1 reached 100 knowledge" },
    { tick: 4000, type: "error", label: "Agent A3 encountered error" },
    { tick: 6000, type: "bookmark", label: "Interesting behavior" },
    { tick: 8000, type: "milestone", label: "First inter-agent communication" },
  ];

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Timeline</h1>
            <p className="text-xs text-zinc-500">Simulation history and playback</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Playback Controls */}
      <div className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
            <Rewind className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
            <FastForward className="w-4 h-4" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-zinc-700 mx-2" />

          <span className="text-sm font-mono text-zinc-400 min-w-[80px]">
            {currentTick.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-600">/</span>
          <span className="text-sm font-mono text-zinc-600">
            {maxTick.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Timeline View */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Zoom Controls */}
        <div className="shrink-0 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-zinc-500 w-12 text-center">{zoom}x</span>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
              <Bookmark className="w-3.5 h-3.5" />
              Add Bookmark
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
              <Flag className="w-3.5 h-3.5" />
              Add Flag
            </button>
          </div>
        </div>

        {/* Timeline Track */}
        <div className="flex-1 overflow-auto p-4">
          <div className="relative h-full min-h-[200px]">
            {/* Time ruler */}
            <div className="absolute top-0 left-0 right-0 h-8 border-b border-zinc-800">
              {Array.from({ length: 11 }, (_, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-zinc-600"
                  style={{ left: `${i * 10}%` }}
                >
                  {((maxTick / 10) * i).toLocaleString()}
                </div>
              ))}
            </div>

            {/* Track background */}
            <div className="absolute top-12 left-0 right-0 bottom-0 bg-zinc-900/50 rounded-lg">
              {/* Events */}
              {events.map((event, i) => (
                <div
                  key={i}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left: `${(event.tick / maxTick) * 100}%`,
                    top: "16px",
                  }}
                >
                  <div
                    className={`w-3 h-3 rounded-full cursor-pointer ${
                      event.type === "milestone" ? "bg-emerald-500" :
                      event.type === "error" ? "bg-red-500" :
                      "bg-blue-500"
                    }`}
                    title={event.label}
                  />
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-zinc-500">
                    {event.label}
                  </div>
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
                style={{ left: `${(currentTick / maxTick) * 100}%` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rotate-45" />
              </div>
            </div>

            {/* Scrubber */}
            <input
              type="range"
              value={currentTick}
              onChange={e => setCurrentTick(parseInt(e.target.value))}
              min={0}
              max={maxTick}
              className="absolute top-12 left-0 right-0 w-full h-24 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="shrink-0 h-48 border-t border-zinc-800 overflow-auto">
        <div className="p-3">
          <h3 className="text-xs font-medium text-zinc-500 mb-2">Events</h3>
          <div className="space-y-1">
            {events.map((event, i) => (
              <button
                key={i}
                onClick={() => setCurrentTick(event.tick)}
                className="w-full flex items-center gap-3 px-2 py-1.5 text-left hover:bg-zinc-800 rounded transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    event.type === "milestone" ? "bg-emerald-500" :
                    event.type === "error" ? "bg-red-500" :
                    "bg-blue-500"
                  }`}
                />
                <span className="text-xs font-mono text-zinc-600 w-16">
                  T{event.tick}
                </span>
                <span className="text-sm text-zinc-300 flex-1">{event.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


