/**
 * TerminalView - Terminal/console interface component
 */

import { useRef, useEffect } from "react";
import { Terminal as TerminalIcon, ChevronRight } from "lucide-react";

export function TerminalView() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new content
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-mono text-xs">
      {/* Terminal output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 space-y-1"
      >
        <div className="text-zinc-600">
          <span className="text-emerald-500">earthlink</span>
          <span className="text-zinc-500">@</span>
          <span className="text-blue-400">simulation</span>
          <span className="text-zinc-500"> ~ </span>
          <span className="text-zinc-400">ready</span>
        </div>
        <div className="text-zinc-500">
          Type commands or watch simulation output here...
        </div>
      </div>

      {/* Input line */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800 bg-zinc-900">
        <ChevronRight className="w-3 h-3 text-emerald-500" />
        <input
          type="text"
          placeholder="Enter command..."
          className="flex-1 bg-transparent text-zinc-300 placeholder:text-zinc-600 outline-none"
        />
      </div>
    </div>
  );
}

