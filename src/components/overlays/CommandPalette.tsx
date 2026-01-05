/**
 * Command Palette
 * 
 * Send commands to agents:
 * - move_to: Navigate agent to location
 * - explore_topic: Learn about a topic
 * - observe_entity: Watch an entity
 * - initiate_social: Start social interaction
 * - rest: Pause exploration
 * 
 * Shows command history and queue status.
 */

import { useState, useCallback } from "react";
import { 
  Terminal, 
  MapPin, 
  BookOpen, 
  Eye, 
  MessageCircle, 
  Pause,
  Send,
  History,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import { commandsApi, type CommandType } from "@/lib/api";
import { useAppStore } from "@/stores/appStore";

interface CommandTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  params: {
    name: string;
    label: string;
    type: "text" | "number" | "select";
    required: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
}

const COMMAND_TEMPLATES: CommandTemplate[] = [
  {
    type: "move_to",
    label: "Move To",
    icon: <MapPin className="w-4 h-4" />,
    params: [
      { name: "lat", label: "Latitude", type: "number", required: true, placeholder: "-34.6037" },
      { name: "lon", label: "Longitude", type: "number", required: true, placeholder: "-58.3816" },
      { name: "reason", label: "Reason", type: "text", required: false, placeholder: "Explore area" },
    ],
  },
  {
    type: "explore_topic",
    label: "Explore Topic",
    icon: <BookOpen className="w-4 h-4" />,
    params: [
      { name: "topic", label: "Topic", type: "text", required: true, placeholder: "local cuisine" },
      { name: "depth", label: "Depth", type: "select", required: false, options: [
        { value: "shallow", label: "Shallow" },
        { value: "moderate", label: "Moderate" },
        { value: "deep", label: "Deep" },
      ]},
    ],
  },
  {
    type: "observe_entity",
    label: "Observe Entity",
    icon: <Eye className="w-4 h-4" />,
    params: [
      { name: "entity_id", label: "Entity ID", type: "text", required: true, placeholder: "entity-123" },
      { name: "duration", label: "Duration (s)", type: "number", required: false, placeholder: "60" },
    ],
  },
  {
    type: "initiate_social",
    label: "Initiate Social",
    icon: <MessageCircle className="w-4 h-4" />,
    params: [
      { name: "target_agent_id", label: "Target Agent", type: "text", required: true, placeholder: "agent-456" },
      { name: "topic", label: "Topic", type: "text", required: false, placeholder: "greet" },
    ],
  },
  {
    type: "rest",
    label: "Rest",
    icon: <Pause className="w-4 h-4" />,
    params: [
      { name: "duration", label: "Duration (s)", type: "number", required: false, placeholder: "300" },
    ],
  },
];

interface CommandHistoryItem {
  id: string;
  command: string;
  agent_id: string;
  params: Record<string, unknown>;
  status: "pending" | "success" | "error";
  timestamp: Date;
  error?: string;
}

interface CommandQueueItem {
  id: string;
  command: CommandType;
  agent_id: string;
  params: Record<string, unknown>;
  status: "queued" | "sending" | "success" | "error";
  error?: string;
}

export function CommandPalette() {
  const { selectedAgentId, agents } = useAppStore();
  
  const [selectedTemplate, setSelectedTemplate] = useState<CommandTemplate | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"templates" | "history" | "queue" | "manual">("templates");
  const [targetAgentId, setTargetAgentId] = useState<string>("");
  const [queue, setQueue] = useState<CommandQueueItem[]>([]);
  const [manualCommand, setManualCommand] = useState<CommandType>("autonomous_step");
  const [manualAgentId, setManualAgentId] = useState<string>("");
  const [manualParams, setManualParams] = useState<string>("{}");
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);

  const currentAgentId = selectedAgentId || targetAgentId;

  const handleSend = useCallback(async () => {
    if (!selectedTemplate || !currentAgentId) return;

    // Build params
    const commandParams: Record<string, unknown> = {};
    for (const param of selectedTemplate.params) {
      if (params[param.name]) {
        if (param.type === "number") {
          commandParams[param.name] = parseFloat(params[param.name]);
        } else {
          commandParams[param.name] = params[param.name];
        }
      }
    }

    // Add to history as pending
    const historyItem: CommandHistoryItem = {
      id: crypto.randomUUID(),
      command: selectedTemplate.type,
      agent_id: currentAgentId,
      params: commandParams,
      status: "pending",
      timestamp: new Date(),
    };
    setHistory((prev) => [historyItem, ...prev]);

    setSending(true);
    try {
      await commandsApi.execute({
        type: selectedTemplate.type as CommandType,
        agent_id: currentAgentId,
        parameters: commandParams,
      });

      // Update history status
      setHistory((prev) =>
        prev.map((item) =>
          item.id === historyItem.id ? { ...item, status: "success" as const } : item
        )
      );

      // Clear form
      setParams({});
      setSelectedTemplate(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Command failed";
      setHistory((prev) =>
        prev.map((item) =>
          item.id === historyItem.id ? { ...item, status: "error" as const, error: message } : item
        )
      );
    } finally {
      setSending(false);
    }
  }, [selectedTemplate, currentAgentId, params]);

  const canSend = selectedTemplate && currentAgentId && !sending;

  const enqueueCommand = () => {
    if (!selectedTemplate || !currentAgentId) return;
    const commandParams: Record<string, unknown> = {};
    for (const param of selectedTemplate.params) {
      if (params[param.name]) {
        commandParams[param.name] = param.type === "number" ? parseFloat(params[param.name]) : params[param.name];
      }
    }
    const item: CommandQueueItem = {
      id: crypto.randomUUID(),
      command: selectedTemplate.type as CommandType,
      agent_id: currentAgentId,
      params: commandParams,
      status: "queued",
    };
    setQueue((prev) => [...prev, item]);
    setParams({});
    setSelectedTemplate(null);
  };

  const processQueue = useCallback(async () => {
    if (processingQueue || queue.length === 0) return;
    setProcessingQueue(true);
    try {
      for (const item of queue) {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "sending" } : q)));
        try {
          await commandsApi.execute({ type: item.command, agent_id: item.agent_id, parameters: item.params });
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "success" } : q)));
        } catch (e) {
          const message = e instanceof Error ? e.message : "Command failed";
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: message } : q)));
        }
      }
    } finally {
      setProcessingQueue(false);
    }
  }, [queue, processingQueue]);

  const clearQueue = () => setQueue([]);

  const sendManual = async () => {
    setManualStatus(null);
    const agentId = manualAgentId || currentAgentId;
    if (!agentId) {
      setManualStatus("Select an agent first");
      return;
    }
    let parsed: Record<string, unknown> = {};
    if (manualParams.trim()) {
      try {
        parsed = JSON.parse(manualParams);
      } catch (e) {
        setManualStatus("Invalid JSON parameters");
        return;
      }
    }
    setSending(true);
    try {
      await commandsApi.execute({ type: manualCommand, agent_id: agentId, parameters: parsed });
      setManualStatus("Sent");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Command failed";
      setManualStatus(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <Terminal className="w-4 h-4" />
          <span>Commands</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {([
            { id: "templates", label: "Templates", icon: <Send className="w-3.5 h-3.5" /> },
            { id: "manual", label: "Manual", icon: <Terminal className="w-3.5 h-3.5" /> },
            { id: "queue", label: "Queue", icon: <ListChecks className="w-3.5 h-3.5" /> },
            { id: "history", label: "History", icon: <History className="w-3.5 h-3.5" /> },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "history" && (
        /* Command History */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
              No commands sent yet
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-2 border border-[var(--color-border-subtle)] rounded text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {item.command}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.status === "pending" && (
                      <Loader2 className="w-3.5 h-3.5 text-[var(--color-primary)] animate-spin" />
                    )}
                    {item.status === "success" && (
                      <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    )}
                    {item.status === "error" && (
                      <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />
                    )}
                  </div>
                </div>
                <div className="text-[var(--color-text-muted)]">
                  Agent: {item.agent_id.slice(0, 8)}...
                </div>
                {item.error && (
                  <div className="mt-1 text-[var(--color-error)]">{item.error}</div>
                )}
                <div className="mt-1 text-[var(--color-text-muted)]">
                  {item.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "templates" && (
        /* Command Builder */
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Target Agent */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              Target Agent
            </label>
            <select
              value={currentAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              className="w-full text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text-primary)]"
            >
              <option value="">Select agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>

          {/* Command Type */}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">
              Command
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {COMMAND_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setParams({});
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded border transition-colors ${
                    selectedTemplate?.type === template.type
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
                  }`}
                >
                  {template.icon}
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* Command Parameters */}
          {selectedTemplate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Parameters
                </label>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              {selectedTemplate.params.map((param) => (
                <div key={param.name}>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                    {param.label}
                    {param.required && <span className="text-[var(--color-error)]">*</span>}
                  </label>
                  {param.type === "select" ? (
                    <select
                      value={params[param.name] || ""}
                      onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                      className="w-full text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text-primary)]"
                    >
                      <option value="">Select...</option>
                      {param.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={param.type === "number" ? "number" : "text"}
                      value={params[param.name] || ""}
                      onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                      placeholder={param.placeholder}
                      className="w-full text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                canSend
                  ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed"
              }`}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
            <button
              onClick={enqueueCommand}
              disabled={!selectedTemplate || !currentAgentId}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Queue
            </button>
          </div>
        </div>
      )}

      {activeTab === "manual" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="space-y-1">
            <label className="block text-xs text-[var(--color-text-muted)]">Agent</label>
            <select
              value={manualAgentId || currentAgentId}
              onChange={(e) => setManualAgentId(e.target.value)}
              className="w-full text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text-primary)]"
            >
              <option value="">Select agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[var(--color-text-muted)]">Command type</label>
            <select
              value={manualCommand}
              onChange={(e) => setManualCommand(e.target.value as CommandType)}
              className="w-full text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-text-primary)]"
            >
              {["autonomous_step","observe_environment","explore_random","move_to","query_knowledge","set_goal","pause","resume","reset","broadcast_message","send_message"]
                .map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-[var(--color-text-muted)]">Parameters (JSON)</label>
            <textarea
              value={manualParams}
              onChange={(e) => setManualParams(e.target.value)}
              rows={6}
              className="w-full text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1.5 font-mono text-[var(--color-text-primary)]"
            />
          </div>

          <button
            onClick={sendManual}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Manual Command
          </button>
          {manualStatus && <div className="text-[11px] text-[var(--color-text-muted)]">{manualStatus}</div>}
        </div>
      )}

      {activeTab === "queue" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Queued commands ({queue.length})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={processQueue}
                disabled={queue.length === 0 || processingQueue}
                className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-50"
              >
                {processingQueue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Run queue
              </button>
              <button
                onClick={clearQueue}
                disabled={queue.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {queue.length === 0 && (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">No queued commands</div>
          )}

          {queue.map((item) => (
            <div key={item.id} className="p-2 border border-[var(--color-border-subtle)] rounded text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-text-primary)]">{item.command}</span>
                  <span className="text-[var(--color-text-muted)]">{item.agent_id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.status === "queued" && <span className="text-[var(--color-text-secondary)]">Queued</span>}
                  {item.status === "sending" && <Loader2 className="w-3.5 h-3.5 text-[var(--color-primary)] animate-spin" />}
                  {item.status === "success" && <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />}
                  {item.status === "error" && <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />}
                </div>
              </div>
              <div className="text-[var(--color-text-muted)] break-words">
                {JSON.stringify(item.params)}
              </div>
              {item.error && <div className="text-[var(--color-error)]">{item.error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

