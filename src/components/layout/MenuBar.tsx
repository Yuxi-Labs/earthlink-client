import { useState } from "react";

type MenuDropdownItem = 
  | { label: string; shortcut?: string; action?: () => void; divider?: false }
  | { divider: true; label?: never; shortcut?: never; action?: never };

interface MenuItemProps {
  label: string;
  items?: MenuDropdownItem[];
}

function MenuItem({ label, items }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="px-3 py-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
      >
        {label}
      </button>
      
      {isOpen && items && (
        <div className="absolute top-full left-0 mt-0.5 min-w-48 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-md shadow-lg py-1 z-50">
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="h-px bg-[var(--color-border)] my-1" />
            ) : (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-[var(--color-text-muted)] ml-4">{item.shortcut}</span>
                )}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuBar() {
  const fileMenuItems: MenuDropdownItem[] = [
    { label: "New Project", shortcut: "Ctrl+N" },
    { label: "Open Project", shortcut: "Ctrl+O" },
    { divider: true },
    { label: "Save", shortcut: "Ctrl+S" },
    { label: "Save As...", shortcut: "Ctrl+Shift+S" },
    { divider: true },
    { label: "Settings", shortcut: "Ctrl+," },
    { divider: true },
    { label: "Exit", shortcut: "Alt+F4" },
  ];

  const editMenuItems: MenuDropdownItem[] = [
    { label: "Undo", shortcut: "Ctrl+Z" },
    { label: "Redo", shortcut: "Ctrl+Y" },
    { divider: true },
    { label: "Cut", shortcut: "Ctrl+X" },
    { label: "Copy", shortcut: "Ctrl+C" },
    { label: "Paste", shortcut: "Ctrl+V" },
  ];

  const viewMenuItems: MenuDropdownItem[] = [
    { label: "2D View", shortcut: "1" },
    { label: "2.5D View", shortcut: "2" },
    { label: "3D View", shortcut: "3" },
    { divider: true },
    { label: "Toggle Sidebar", shortcut: "Ctrl+B" },
    { label: "Toggle Terminal", shortcut: "Ctrl+`" },
    { divider: true },
    { label: "Zoom In", shortcut: "Ctrl+=" },
    { label: "Zoom Out", shortcut: "Ctrl+-" },
    { label: "Reset Zoom", shortcut: "Ctrl+0" },
  ];

  const simulationMenuItems: MenuDropdownItem[] = [
    { label: "Start Simulation", shortcut: "F5" },
    { label: "Pause Simulation", shortcut: "F6" },
    { label: "Stop Simulation", shortcut: "Shift+F5" },
    { divider: true },
    { label: "Speed: 0.5x" },
    { label: "Speed: 1x" },
    { label: "Speed: 2x" },
    { label: "Speed: 10x" },
  ];

  const helpMenuItems: MenuDropdownItem[] = [
    { label: "Documentation" },
    { label: "Keyboard Shortcuts", shortcut: "Ctrl+K Ctrl+S" },
    { divider: true },
    { label: "About Earthlink" },
  ];

  return (
    <header className="flex items-center h-8 px-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] select-none" data-tauri-drag-region>
      {/* App Icon */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <span className="text-xs font-bold text-white">E</span>
        </div>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">Earthlink</span>
      </div>

      {/* Menu Items */}
      <nav className="flex items-center gap-0.5">
        <MenuItem label="File" items={fileMenuItems} />
        <MenuItem label="Edit" items={editMenuItems} />
        <MenuItem label="View" items={viewMenuItems} />
        <MenuItem label="Simulation" items={simulationMenuItems} />
        <MenuItem label="Help" items={helpMenuItems} />
      </nav>

      {/* Spacer for drag region */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Window controls are handled by Tauri */}
    </header>
  );
}
