import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { getCurrentWindowType, getWindowParams } from "./lib/windows";

// Window Components
import { AgentInspectorWindow } from "./windows/AgentInspectorWindow";
import { MetricsDashboardWindow } from "./windows/MetricsDashboardWindow";
import { ExperimentDesignerWindow } from "./windows/ExperimentDesignerWindow";
import { ComparisonWindow } from "./windows/ComparisonWindow";
import { DataBrowserWindow } from "./windows/DataBrowserWindow";
import { SettingsWindow } from "./windows/SettingsWindow";
import { AboutWindow } from "./windows/AboutWindow";
import { TerminalWindow } from "./windows/TerminalWindow";
import { TimelineWindow } from "./windows/TimelineWindow";
import { MemoryBrowserWindow } from "./windows/MemoryBrowserWindow";
import { LogViewerWindow } from "./windows/LogViewerWindow";
import { KeyboardShortcutsWindow } from "./windows/KeyboardShortcutsWindow";

function WindowRouter() {
  const windowType = getCurrentWindowType();
  const params = getWindowParams();

  switch (windowType) {
    // Core Research
    case "agent-inspector":
      return <AgentInspectorWindow agentId={params.agentId} />;
    case "metrics-dashboard":
      return <MetricsDashboardWindow />;
    case "experiment-designer":
      return <ExperimentDesignerWindow />;
    case "comparison":
      return <ComparisonWindow initialAgentIds={params.agents?.split(",").filter(Boolean)} />;
    case "data-browser":
      return <DataBrowserWindow />;
    
    // Inspection (reuse AgentInspector with different tabs)
    case "memory-browser":
      return <MemoryBrowserWindow agentId={params.agentId} />;
    
    // Utility
    case "timeline":
      return <TimelineWindow />;
    case "terminal":
      return <TerminalWindow />;
    case "log-viewer":
      return <LogViewerWindow />;
    
    // App
    case "settings":
      return <SettingsWindow />;
    case "about":
      return <AboutWindow />;
    case "keyboard-shortcuts":
      return <KeyboardShortcutsWindow />;
    
    // Main app
    case "main":
    default:
      return <App />;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WindowRouter />
  </React.StrictMode>,
);
