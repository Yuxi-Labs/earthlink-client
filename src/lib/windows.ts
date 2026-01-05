/**
 * Window Management for Earthlink Desktop App
 * 
 * A TRUE desktop application with multiple independent windows.
 */

import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export type WindowType = 
  | "agent-inspector"
  | "metrics-dashboard"
  | "experiment-designer"
  | "comparison"
  | "data-browser"
  | "knowledge-graph"
  | "interaction-graph"
  | "memory-browser"
  | "goal-inspector"
  | "decision-trace"
  | "timeline"
  | "terminal"
  | "log-viewer"
  | "settings"
  | "about"
  | "keyboard-shortcuts";

interface WindowConfig {
  title: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  singleton?: boolean;
}

const WINDOW_CONFIGS: Record<WindowType, WindowConfig> = {
  "agent-inspector": { title: "Agent Inspector", width: 900, height: 750, minWidth: 700, minHeight: 500 },
  "metrics-dashboard": { title: "Metrics Dashboard", width: 1100, height: 750, minWidth: 800, minHeight: 500 },
  "experiment-designer": { title: "Experiment Designer", width: 800, height: 650, minWidth: 600, minHeight: 450 },
  "comparison": { title: "Agent Comparison", width: 1200, height: 750, minWidth: 900, minHeight: 500 },
  "data-browser": { title: "Data Browser", width: 1100, height: 650, minWidth: 800, minHeight: 400 },
  "knowledge-graph": { title: "Knowledge Graph", width: 1000, height: 750, minWidth: 700, minHeight: 500 },
  "interaction-graph": { title: "Interaction Graph", width: 1000, height: 750, minWidth: 700, minHeight: 500 },
  "memory-browser": { title: "Memory Browser", width: 800, height: 600, minWidth: 500, minHeight: 400 },
  "goal-inspector": { title: "Goal Inspector", width: 700, height: 600, minWidth: 450, minHeight: 400 },
  "decision-trace": { title: "Decision Trace", width: 800, height: 600, minWidth: 550, minHeight: 400 },
  "timeline": { title: "Timeline", width: 1100, height: 400, minWidth: 700, minHeight: 250 },
  "terminal": { title: "Terminal", width: 800, height: 500, minWidth: 400, minHeight: 250 },
  "log-viewer": { title: "Log Viewer", width: 900, height: 500, minWidth: 500, minHeight: 300 },
  "settings": { title: "Settings", width: 850, height: 600, minWidth: 650, minHeight: 450, singleton: true },
  "about": { title: "About Earthlink", width: 500, height: 400, minWidth: 400, minHeight: 350, singleton: true },
  "keyboard-shortcuts": { title: "Keyboard Shortcuts", width: 600, height: 700, minWidth: 450, minHeight: 500, singleton: true },
};

let windowCounter = 0;

/**
 * Open a new window of the specified type
 */
export async function openWindow(
  type: WindowType,
  params?: Record<string, string>
): Promise<WebviewWindow | null> {
  const config = WINDOW_CONFIGS[type];
  if (!config) {
    console.error(`Unknown window type: ${type}`);
    return null;
  }
  
  // Generate unique label
  windowCounter++;
  const paramSuffix = params ? `-${Object.values(params).join("-")}` : "";
  const windowLabel = config.singleton 
    ? type 
    : `${type}${paramSuffix}-${windowCounter}`.replace(/[^a-zA-Z0-9-]/g, "");
  
  // For singleton windows, try to focus existing
  if (config.singleton) {
    try {
      const existing = await WebviewWindow.getByLabel(windowLabel);
      if (existing) {
        await existing.setFocus();
        return existing;
      }
    } catch {
      // Window doesn't exist, continue to create
    }
  }
  
  // Build URL - use query params that main.tsx will read
  const urlParams = new URLSearchParams({ window: type });
  if (params) {
    Object.entries(params).forEach(([k, v]) => urlParams.set(k, v));
  }
  const url = `/?${urlParams.toString()}`;
  
  console.log(`[Windows] Opening ${type} window with URL: ${url}`);
  
  try {
    const webview = new WebviewWindow(windowLabel, {
      url,
      title: params?.agentId ? `${config.title} - ${params.agentId}` : config.title,
      width: config.width,
      height: config.height,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      center: true,
      resizable: true,
    });
    
    // Wait for creation
    return new Promise((resolve) => {
      webview.once("tauri://created", () => {
        console.log(`[Windows] ${type} window created successfully`);
        resolve(webview);
      });
      webview.once("tauri://error", (e) => {
        console.error(`[Windows] Failed to create ${type} window:`, e);
        resolve(null);
      });
      
      // Timeout fallback
      setTimeout(() => {
        console.warn(`[Windows] ${type} window creation timed out, may have succeeded`);
        resolve(webview);
      }, 3000);
    });
  } catch (error) {
    console.error(`[Windows] Error creating ${type} window:`, error);
    return null;
  }
}

// Convenience functions
export const openAgentInspector = (agentId: string) => openWindow("agent-inspector", { agentId });
export const openMetricsDashboard = () => openWindow("metrics-dashboard");
export const openExperimentDesigner = () => openWindow("experiment-designer");
export const openComparison = (agentIds?: string[]) => openWindow("comparison", agentIds?.length ? { agents: agentIds.join(",") } : undefined);
export const openDataBrowser = () => openWindow("data-browser");
export const openKnowledgeGraph = (agentId?: string) => openWindow("knowledge-graph", agentId ? { agentId } : undefined);
export const openInteractionGraph = () => openWindow("interaction-graph");
export const openMemoryBrowser = (agentId: string) => openWindow("memory-browser", { agentId });
export const openGoalInspector = (agentId: string) => openWindow("goal-inspector", { agentId });
export const openDecisionTrace = (agentId: string) => openWindow("decision-trace", { agentId });
export const openTimeline = () => openWindow("timeline");
export const openTerminal = () => openWindow("terminal");
export const openLogViewer = () => openWindow("log-viewer");
export const openSettings = () => openWindow("settings");
export const openAbout = () => openWindow("about");
export const openKeyboardShortcuts = () => openWindow("keyboard-shortcuts");

// Utilities
export function getCurrentWindowType(): WindowType | "main" {
  const params = new URLSearchParams(window.location.search);
  return (params.get("window") as WindowType) || "main";
}

export function getWindowParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key !== "window") result[key] = value;
  });
  return result;
}
