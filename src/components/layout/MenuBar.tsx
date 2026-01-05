/**
 * MenuBar - Standard desktop application menus
 * 
 * Like Affinity/Photoshop/VS Code - menu items open dedicated windows.
 */

import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import {
  openAgentInspector,
  openMetricsDashboard,
  openExperimentDesigner,
  openComparison,
  openDataBrowser,
  openKnowledgeGraph,
  openInteractionGraph,
  openMemoryBrowser,
  openGoalInspector,
  openTimeline,
  openTerminal,
  openLogViewer,
  openSettings,
  openAbout,
  openKeyboardShortcuts,
} from "@/lib/windows";

type MenuDropdownItem =
  | { label: string; shortcut?: string; action?: () => void; disabled?: boolean; checked?: boolean }
  | { divider: true };

interface MenuItemProps {
  label: string;
  items: MenuDropdownItem[];
}

function MenuItem({ label, items }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="px-3 py-1 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors">
        {label}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-0.5 min-w-56 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-50">
          {items.map((item, index) =>
            "divider" in item ? (
              <div key={index} className="h-px bg-zinc-800 my-1" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  item.action?.();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
                  item.disabled
                    ? "text-zinc-600 cursor-not-allowed"
                    : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.checked !== undefined && (
                    <span className="w-4 text-blue-400">{item.checked ? "✓" : ""}</span>
                  )}
                  {item.label}
                </span>
                {item.shortcut && (
                  <span className="text-xs text-zinc-500 ml-4">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function MenuBar() {
  const {
    setViewMode,
    viewMode,
    startSimulation,
    pauseSimulation,
    selectedAgentId,
    simulationState,
  } = useAppStore();

  // File Menu
  const fileMenu: MenuDropdownItem[] = [
    { label: "New Experiment...", shortcut: "Ctrl+N", action: () => openExperimentDesigner() },
    { label: "Open Experiment...", shortcut: "Ctrl+O", disabled: true },
    { label: "Recent Experiments", disabled: true },
    { divider: true },
    { label: "Save", shortcut: "Ctrl+S", disabled: true },
    { label: "Save As...", shortcut: "Ctrl+Shift+S", disabled: true },
    { divider: true },
    { label: "Export Data...", action: () => openDataBrowser() },
    { divider: true },
    { label: "Settings...", shortcut: "Ctrl+,", action: () => openSettings() },
    { divider: true },
    { label: "Exit", shortcut: "Alt+F4" },
  ];

  // Edit Menu
  const editMenu: MenuDropdownItem[] = [
    { label: "Undo", shortcut: "Ctrl+Z", disabled: true },
    { label: "Redo", shortcut: "Ctrl+Y", disabled: true },
    { divider: true },
    { label: "Copy Agent Data", shortcut: "Ctrl+C", disabled: true },
    { divider: true },
    { label: "Select All Agents", shortcut: "Ctrl+A", disabled: true },
    { label: "Deselect", shortcut: "Esc", disabled: true },
  ];

  // View Menu
  const viewMenu: MenuDropdownItem[] = [
    { label: "2D Map", shortcut: "1", action: () => setViewMode("2d"), checked: viewMode === "2d" },
    { label: "2.5D Perspective", shortcut: "2", action: () => setViewMode("2.5d"), checked: viewMode === "2.5d" },
    { label: "3D Globe", shortcut: "3", action: () => setViewMode("3d"), checked: viewMode === "3d" },
    { divider: true },
    { label: "Zoom In", shortcut: "Ctrl++", disabled: true },
    { label: "Zoom Out", shortcut: "Ctrl+-", disabled: true },
    { label: "Fit to Window", shortcut: "Ctrl+0", disabled: true },
    { divider: true },
    { label: "Show Agent Labels", checked: true, disabled: true },
    { label: "Show Agent Trails", checked: true, disabled: true },
    { label: "Show Signal Bursts", checked: true, disabled: true },
  ];

  // Simulation Menu
  const simulationMenu: MenuDropdownItem[] = [
    { label: "Start", shortcut: "F5", action: startSimulation, disabled: simulationState === "running" },
    { label: "Pause", shortcut: "F6", action: pauseSimulation, disabled: simulationState !== "running" },
    { divider: true },
    { label: "Slow Down", shortcut: "," },
    { label: "Speed Up", shortcut: "." },
    { divider: true },
    { label: "New Experiment...", shortcut: "Ctrl+N", action: () => openExperimentDesigner() },
    { divider: true },
    { label: "Take Snapshot", shortcut: "Ctrl+Shift+S", disabled: true },
    { label: "Restore Snapshot...", disabled: true },
  ];

  // Agents Menu
  const agentsMenu: MenuDropdownItem[] = [
    {
      label: "Inspect Agent",
      shortcut: "Enter",
      action: selectedAgentId ? () => openAgentInspector(selectedAgentId) : undefined,
      disabled: !selectedAgentId,
    },
    { label: "Compare Agents...", shortcut: "Ctrl+Shift+C", action: () => openComparison() },
    { divider: true },
    {
      label: "Memory Browser",
      action: selectedAgentId ? () => openMemoryBrowser(selectedAgentId) : undefined,
      disabled: !selectedAgentId,
    },
    {
      label: "Goal Inspector",
      action: selectedAgentId ? () => openGoalInspector(selectedAgentId) : undefined,
      disabled: !selectedAgentId,
    },
    { divider: true },
    { label: "Filter by Status...", disabled: true },
    { label: "Sort by...", disabled: true },
  ];

  // Analysis Menu
  const analysisMenu: MenuDropdownItem[] = [
    { label: "Metrics Dashboard", shortcut: "Ctrl+M", action: () => openMetricsDashboard() },
    { label: "Data Browser", shortcut: "Ctrl+D", action: () => openDataBrowser() },
    { divider: true },
    { label: "Knowledge Graph", action: () => openKnowledgeGraph() },
    { label: "Interaction Graph", action: () => openInteractionGraph() },
    { divider: true },
    { label: "Learning Dynamics", disabled: true },
    { label: "Exploration Efficiency", disabled: true },
    { divider: true },
    { label: "Generate Report...", disabled: true },
  ];

  // Window Menu (like Affinity/Photoshop)
  const windowMenu: MenuDropdownItem[] = [
    { label: "New Observatory Window", disabled: true },
    { divider: true },
    { label: "Metrics Dashboard", action: () => openMetricsDashboard() },
    { label: "Data Browser", action: () => openDataBrowser() },
    { label: "Timeline", action: () => openTimeline() },
    { label: "Terminal", shortcut: "Ctrl+`", action: () => openTerminal() },
    { label: "Log Viewer", action: () => openLogViewer() },
    { divider: true },
    { label: "Agent Inspector", action: selectedAgentId ? () => openAgentInspector(selectedAgentId) : undefined, disabled: !selectedAgentId },
    { label: "Memory Browser", action: selectedAgentId ? () => openMemoryBrowser(selectedAgentId) : undefined, disabled: !selectedAgentId },
    { label: "Comparison", action: () => openComparison() },
    { divider: true },
    { label: "Close Window", shortcut: "Ctrl+W", disabled: true },
    { label: "Close All Windows", shortcut: "Ctrl+Shift+W", disabled: true },
  ];

  // Help Menu
  const helpMenu: MenuDropdownItem[] = [
    { label: "Documentation", shortcut: "F1", disabled: true },
    { label: "Keyboard Shortcuts", shortcut: "Ctrl+K", action: () => openKeyboardShortcuts() },
    { divider: true },
    { label: "Research Guide", disabled: true },
    { label: "API Reference", disabled: true },
    { divider: true },
    { label: "Check for Updates...", disabled: true },
    { divider: true },
    { label: "About Earthlink", action: () => openAbout() },
  ];

  return (
    <header
      className="flex items-center h-8 px-2 bg-zinc-900 border-b border-zinc-800 select-none"
      data-tauri-drag-region
    >
      <nav className="flex items-center">
        <MenuItem label="File" items={fileMenu} />
        <MenuItem label="Edit" items={editMenu} />
        <MenuItem label="View" items={viewMenu} />
        <MenuItem label="Simulation" items={simulationMenu} />
        <MenuItem label="Agents" items={agentsMenu} />
        <MenuItem label="Analysis" items={analysisMenu} />
        <MenuItem label="Window" items={windowMenu} />
        <MenuItem label="Help" items={helpMenu} />
      </nav>
      <div className="flex-1" data-tauri-drag-region />
    </header>
  );
}
