/**
 * Keyboard Shortcuts Window
 */

import { Keyboard } from "lucide-react";
import "@/App.css";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "N"], description: "New Experiment" },
      { keys: ["Ctrl", "O"], description: "Open Experiment" },
      { keys: ["Ctrl", "S"], description: "Save" },
      { keys: ["Ctrl", ","], description: "Settings" },
      { keys: ["Ctrl", "Q"], description: "Quit" },
    ],
  },
  {
    title: "Simulation",
    shortcuts: [
      { keys: ["F5"], description: "Start Simulation" },
      { keys: ["F6"], description: "Pause Simulation" },
      { keys: [","], description: "Slow Down" },
      { keys: ["."], description: "Speed Up" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: ["1"], description: "2D Map View" },
      { keys: ["2"], description: "2.5D Perspective" },
      { keys: ["3"], description: "3D Globe" },
      { keys: ["Ctrl", "`"], description: "Toggle Terminal" },
      { keys: ["Ctrl", "M"], description: "Metrics Dashboard" },
      { keys: ["Ctrl", "D"], description: "Data Browser" },
    ],
  },
  {
    title: "Agents",
    shortcuts: [
      { keys: ["Enter"], description: "Inspect Selected Agent" },
      { keys: ["Ctrl", "Shift", "C"], description: "Compare Agents" },
      { keys: ["Esc"], description: "Deselect Agent" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Select Agent" },
      { keys: ["Tab"], description: "Next Panel" },
      { keys: ["Shift", "Tab"], description: "Previous Panel" },
    ],
  },
  {
    title: "Windows",
    shortcuts: [
      { keys: ["Ctrl", "W"], description: "Close Window" },
      { keys: ["Ctrl", "Shift", "W"], description: "Close All Windows" },
    ],
  },
];

export function KeyboardShortcutsWindow() {
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold">Keyboard Shortcuts</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-8">
          {SHORTCUTS.map(group => (
            <div key={group.title}>
              <h2 className="text-sm font-medium text-zinc-400 mb-3">{group.title}</h2>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 font-mono">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-zinc-600 mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


