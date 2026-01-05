import React from "react";
import { useAppStore } from "@/stores/appStore";
import { LayoutPanelLeft, ActivitySquare, TerminalSquare, Circle } from "lucide-react";
import { Tooltip } from "@/components/overlays/Tooltip";

interface RailButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function RailButton({ icon, label, active, onClick }: RailButtonProps) {
  return (
    <Tooltip content={label} position="right">
      <button
        onClick={onClick}
        className={`flex h-11 w-11 items-center justify-center rounded-md border border-transparent text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300
          ${active ? "border border-zinc-700 text-zinc-200" : ""}
        `}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </button>
    </Tooltip>
  );
}

export function NavigationRail() {
  const {
    showAgentPanel,
    showMetricsPanel,
    showTerminal,
    toggleAgentPanel,
    toggleMetricsPanel,
    toggleTerminal,
  } = useAppStore();

  return (
    <div className="flex w-14 flex-col items-center gap-2 border-r border-zinc-800 bg-zinc-900 px-1 py-3">
      {/* App icon */}
      <Tooltip content="Earthlink" position="right">
        <div className="mb-2 pb-2 border-b border-zinc-800 w-full flex justify-center cursor-default">
          <Circle className="w-6 h-6 text-zinc-400" />
        </div>
      </Tooltip>

      <RailButton
        icon={<LayoutPanelLeft className="h-5 w-5" />}
        label="Agent Panel"
        active={showAgentPanel}
        onClick={toggleAgentPanel}
      />
      <RailButton
        icon={<ActivitySquare className="h-5 w-5" />}
        label="Metrics Panel"
        active={showMetricsPanel}
        onClick={toggleMetricsPanel}
      />
      <RailButton
        icon={<TerminalSquare className="h-5 w-5" />}
        label="Terminal"
        active={showTerminal}
        onClick={toggleTerminal}
      />
    </div>
  );
}
