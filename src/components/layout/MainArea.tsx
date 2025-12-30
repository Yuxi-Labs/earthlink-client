import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { wsClient } from "@/lib/api";
import { AgentPanel } from "@/components/panels/AgentPanel";
import { CommandPalette } from "@/components/panels/CommandPalette";
import { MapView } from "@/components/panels/MapView";
import { MetricsPanel } from "@/components/panels/MetricsPanel";
import { ReadinessPanel } from "@/components/panels/ReadinessPanel";
import { KnowledgePanel } from "@/components/panels/KnowledgePanel";
import { TargetWorldsPanel } from "@/components/panels/TargetWorldsPanel";
import { TerminalPanel } from "@/components/panels/TerminalPanel";
import { PanelResizeHandle } from "@/components/ui/PanelResizeHandle";
import { BarChart3, Rocket, BookOpen, Bot, Terminal, Target, RefreshCw } from "lucide-react";

type RightPanelTab = "metrics" | "readiness" | "knowledge" | "worlds";
type LeftPanelTab = "agents" | "commands";

export function MainArea() {
  const { showAgentPanel, showMetricsPanel, showTerminal, connectionStatus } = useAppStore();
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("metrics");
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("agents");

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Agent Panel / Command Palette */}
      {showAgentPanel && (
        <>
          <div className="w-72 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden flex flex-col">
            {/* Tab Switcher */}
            <div className="flex border-b border-[var(--color-border)]">
              <button
                onClick={() => setLeftPanelTab("agents")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  leftPanelTab === "agents"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Agents
              </button>
              <button
                onClick={() => setLeftPanelTab("commands")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  leftPanelTab === "commands"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Commands
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {leftPanelTab === "agents" && <AgentPanel />}
              {leftPanelTab === "commands" && <CommandPalette />}
            </div>
          </div>
          <PanelResizeHandle />
        </>
      )}

      {/* Center - Main View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map/Visualization Area */}
        <div className={`flex-1 overflow-hidden ${showTerminal ? "" : ""}`}>
          {connectionStatus === "connected" ? (
            <MapView />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[var(--color-bg-primary)]">
              <Bot className={`w-16 h-16 text-[var(--color-text-muted)] mb-4 ${connectionStatus === "connecting" ? "animate-pulse" : ""}`} />
              <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                {connectionStatus === "connecting" ? "Connecting to backend..." : "Backend Disconnected"}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                {connectionStatus === "connecting" 
                  ? "Establishing connection to Earthlink server..."
                  : "Map visualization requires active backend connection"}
              </p>
              {connectionStatus === "disconnected" && (
                <button
                  onClick={() => wsClient.retry()}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Terminal Panel - Bottom */}
        {showTerminal && (
          <>
            <PanelResizeHandle orientation="horizontal" />
            <div className="h-48 flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
              <TerminalPanel />
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar - Metrics/Readiness Panel */}
      {showMetricsPanel && (
        <>
          <PanelResizeHandle />
          <div className="w-80 flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden flex flex-col">
            {/* Tab Switcher */}
            <div className="flex border-b border-[var(--color-border)]">
              <button
                onClick={() => setRightPanelTab("metrics")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === "metrics"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Metrics
              </button>
              <button
                onClick={() => setRightPanelTab("knowledge")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === "knowledge"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Learn
              </button>
              <button
                onClick={() => setRightPanelTab("readiness")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === "readiness"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                Ready
              </button>
              <button
                onClick={() => setRightPanelTab("worlds")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  rightPanelTab === "worlds"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Worlds
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelTab === "metrics" && <MetricsPanel />}
              {rightPanelTab === "knowledge" && <KnowledgePanel />}
              {rightPanelTab === "readiness" && <ReadinessPanel />}
              {rightPanelTab === "worlds" && <TargetWorldsPanel />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
