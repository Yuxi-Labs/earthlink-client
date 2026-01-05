/**
 * Terminal Window
 * 
 * Standalone terminal window for command interface
 */

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "@/App.css";

export function TerminalWindow() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: "#09090b",
        foreground: "#a1a1aa",
        cursor: "#3b82f6",
        cursorAccent: "#09090b",
        selectionBackground: "#3b82f640",
        black: "#18181b",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#fafafa",
        brightBlack: "#52525b",
        brightRed: "#f87171",
        brightGreen: "#4ade80",
        brightYellow: "#facc15",
        brightBlue: "#60a5fa",
        brightMagenta: "#c084fc",
        brightCyan: "#22d3ee",
        brightWhite: "#ffffff",
      },
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      cursorBlink: true,
      cursorStyle: "block",
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;

    // Welcome message
    terminal.writeln("\x1b[1;36mEarthlink Terminal\x1b[0m");
    terminal.writeln("Type \x1b[33mhelp\x1b[0m for available commands.\n");
    terminal.write("\x1b[32m❯\x1b[0m ");

    let currentLine = "";

    terminal.onData((data) => {
      if (data === "\r") {
        terminal.writeln("");
        handleCommand(terminal, currentLine.trim());
        currentLine = "";
        terminal.write("\x1b[32m❯\x1b[0m ");
      } else if (data === "\x7f") {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write("\b \b");
        }
      } else if (data >= " ") {
        currentLine += data;
        terminal.write(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      terminal.dispose();
    };
  }, []);

  return (
    <div className="h-screen bg-zinc-950 flex flex-col">
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
}

function handleCommand(terminal: Terminal, command: string) {
  const [cmd] = command.split(" ");

  switch (cmd.toLowerCase()) {
    case "":
      break;
    case "help":
      terminal.writeln("\x1b[1mAvailable commands:\x1b[0m");
      terminal.writeln("  \x1b[33mhelp\x1b[0m        - Show this help");
      terminal.writeln("  \x1b[33mstatus\x1b[0m      - Show simulation status");
      terminal.writeln("  \x1b[33magents\x1b[0m      - List all agents");
      terminal.writeln("  \x1b[33mstart\x1b[0m       - Start simulation");
      terminal.writeln("  \x1b[33mpause\x1b[0m       - Pause simulation");
      terminal.writeln("  \x1b[33mclear\x1b[0m       - Clear terminal");
      terminal.writeln("  \x1b[33mversion\x1b[0m     - Show version");
      break;
    case "status":
      terminal.writeln("\x1b[1mSimulation Status:\x1b[0m");
      terminal.writeln("  State: \x1b[32mrunning\x1b[0m");
      terminal.writeln("  Tick: 1,234");
      terminal.writeln("  Speed: 1.0x");
      terminal.writeln("  Agents: 5");
      break;
    case "agents":
      terminal.writeln("\x1b[1mAgents:\x1b[0m");
      terminal.writeln("  A1 - \x1b[32mexploring\x1b[0m - 42 knowledge");
      terminal.writeln("  A2 - \x1b[33mlearning\x1b[0m  - 38 knowledge");
      terminal.writeln("  A3 - \x1b[32mexploring\x1b[0m - 51 knowledge");
      break;
    case "start":
      terminal.writeln("\x1b[32m✓\x1b[0m Simulation started");
      break;
    case "pause":
      terminal.writeln("\x1b[33m⏸\x1b[0m Simulation paused");
      break;
    case "clear":
      terminal.clear();
      break;
    case "version":
      terminal.writeln("Earthlink v0.1.0");
      break;
    default:
      terminal.writeln(`\x1b[31mUnknown command:\x1b[0m ${cmd}`);
      terminal.writeln("Type \x1b[33mhelp\x1b[0m for available commands.");
  }
}

