import { useEffect, useRef, useCallback } from "react";
import { Terminal as TerminalIcon, X, Minus, Maximize2, Trash2 } from "lucide-react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useAppStore } from "@/stores/appStore";
import { simulationApi, agentsApi } from "@/lib/api";
import "@xterm/xterm/css/xterm.css";

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      theme: {
        background: "#0a0a0f",
        foreground: "#e4e4e7",
        cursor: "#00c8ff",
        cursorAccent: "#0a0a0f",
        selectionBackground: "rgba(0, 200, 255, 0.3)",
        black: "#27272a",
        red: "#ef4444",
        green: "#00c896",
        yellow: "#eab308",
        blue: "#00c8ff",
        magenta: "#a78bfa",
        cyan: "#22d3ee",
        white: "#e4e4e7",
        brightBlack: "#52525b",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#facc15",
        brightBlue: "#60a5fa",
        brightMagenta: "#c4b5fd",
        brightCyan: "#67e8f9",
        brightWhite: "#fafafa",
      },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 1000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln("\x1b[36m╔═══════════════════════════════════════════╗\x1b[0m");
    term.writeln("\x1b[36m║\x1b[0m    \x1b[1;37mEarthlink Agent Simulation Terminal\x1b[0m    \x1b[36m║\x1b[0m");
    term.writeln("\x1b[36m╚═══════════════════════════════════════════╝\x1b[0m");
    term.writeln("");
    term.writeln("\x1b[33m[INFO]\x1b[0m Connecting to backend...");
    term.writeln("\x1b[32m[SUCCESS]\x1b[0m Terminal ready");
    term.writeln("");
    term.write("\x1b[36m❯\x1b[0m ");

    // Handle input
    let currentLine = "";
    term.onData((data) => {
      // Handle special keys
      if (data === "\r") { // Enter
        term.writeln("");
        if (currentLine.trim()) {
          handleCommand(currentLine.trim(), term);
        }
        currentLine = "";
        term.write("\x1b[36m❯\x1b[0m ");
      } else if (data === "\x7f") { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write("\b \b");
        }
      } else if (data >= " ") { // Printable characters
        currentLine += data;
        term.write(data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // Command handler - queries actual backend API
  const handleCommand = useCallback(async (command: string, term: Terminal) => {
    const cmd = command.toLowerCase().trim();
    const { agents, connectionStatus, simulationState, simulationTick, simulationSpeed } = useAppStore.getState();
    
    switch (cmd) {
      case "help":
        term.writeln("\x1b[1;37mAvailable commands:\x1b[0m");
        term.writeln("  \x1b[36mhelp\x1b[0m      - Show this help");
        term.writeln("  \x1b[36mclear\x1b[0m     - Clear terminal");
        term.writeln("  \x1b[36mstatus\x1b[0m    - Show simulation status");
        term.writeln("  \x1b[36magents\x1b[0m    - List agents from backend");
        term.writeln("  \x1b[36mstart\x1b[0m     - Start simulation");
        term.writeln("  \x1b[36mstop\x1b[0m      - Stop simulation");
        term.writeln("  \x1b[36mpause\x1b[0m     - Pause simulation");
        break;
      case "clear":
        term.clear();
        break;
      case "status":
        term.writeln("\x1b[33m[INFO]\x1b[0m Earthlink Status:");
        term.writeln(`  Connection: ${connectionStatus === "connected" ? "\x1b[32mConnected\x1b[0m" : "\x1b[31m" + connectionStatus + "\x1b[0m"}`);
        term.writeln(`  Simulation: ${simulationState === "running" ? "\x1b[32mRunning\x1b[0m" : simulationState}`);
        term.writeln(`  Tick: ${simulationTick}`);
        term.writeln(`  Speed: ${simulationSpeed}x`);
        term.writeln(`  Active Agents: ${agents.length}`);
        break;
      case "agents":
        if (agents.length === 0) {
          term.writeln("\x1b[33m[INFO]\x1b[0m No agents loaded from backend");
          if (connectionStatus !== "connected") {
            term.writeln("\x1b[31m[WARN]\x1b[0m Backend not connected - agents come from the server");
          }
        } else {
          term.writeln("\x1b[33m[INFO]\x1b[0m Agent Registry:");
          agents.forEach(agent => {
            const statusColor = {
              idle: "\x1b[90m",
              exploring: "\x1b[36m",
              learning: "\x1b[33m",
              interacting: "\x1b[34m",
              executing: "\x1b[32m",
              adapting: "\x1b[35m",
              overloaded: "\x1b[31m",
              corrupted: "\x1b[31m",
              retired: "\x1b[90m",
            }[agent.status as string] || "\x1b[37m";
            const knowledge = typeof agent.metrics?.knowledge_acquired === 'number' ? agent.metrics.knowledge_acquired.toFixed(1) : 'N/A';
            const statusLabel = agent.status || "unknown";
            term.writeln(`  ${statusColor}●\x1b[0m ${agent.name}   ${statusColor}${statusLabel}\x1b[0m   knowledge: ${knowledge}`);
          });
        }
        break;
      case "start":
        try {
          await simulationApi.start();
          term.writeln("\x1b[32m[SUCCESS]\x1b[0m Simulation start requested");
        } catch (e) {
          term.writeln(`\x1b[31m[ERROR]\x1b[0m Failed to start: ${e}`);
        }
        break;
      case "stop":
        try {
          await simulationApi.stop();
          term.writeln("\x1b[33m[INFO]\x1b[0m Simulation stop requested");
        } catch (e) {
          term.writeln(`\x1b[31m[ERROR]\x1b[0m Failed to stop: ${e}`);
        }
        break;
      case "pause":
        try {
          await simulationApi.pause();
          term.writeln("\x1b[33m[INFO]\x1b[0m Simulation pause requested");
        } catch (e) {
          term.writeln(`\x1b[31m[ERROR]\x1b[0m Failed to pause: ${e}`);
        }
        break;
      case "fetch":
        try {
          term.writeln("\x1b[33m[INFO]\x1b[0m Fetching agents from backend...");
          const result = await agentsApi.list();
          term.writeln(`\x1b[32m[SUCCESS]\x1b[0m Received ${(result as { agents: unknown[] }).agents?.length || 0} agents`);
        } catch (e) {
          term.writeln(`\x1b[31m[ERROR]\x1b[0m Failed to fetch: ${e}`);
        }
        break;
      default:
        term.writeln(`\x1b[31m[ERROR]\x1b[0m Unknown command: ${command}`);
        term.writeln("Type \x1b[36mhelp\x1b[0m for available commands");
    }
  }, []);

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
          <TerminalIcon className="w-4 h-4" />
          <span>Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleClear}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <Maximize2 className="w-3 h-3" />
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-hidden p-1"
        style={{ backgroundColor: "#0a0a0f" }}
      />
    </div>
  );
}
