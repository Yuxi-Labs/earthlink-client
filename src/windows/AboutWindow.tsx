/**
 * About Window
 */

import { Globe2, Github, ExternalLink } from "lucide-react";
import "@/App.css";

export function AboutWindow() {
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8">
      {/* Logo/Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
        <Globe2 className="w-10 h-10 text-white" />
      </div>

      {/* App Name & Version */}
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Earthlink</h1>
      <p className="text-sm text-zinc-500 mb-6">Version 0.1.0</p>

      {/* Description */}
      <p className="text-center text-zinc-400 text-sm max-w-sm mb-8">
        A multi-agent simulation platform for autonomous exploration research.
        Agents learn to navigate virtual worlds to prepare for exploring real ones.
      </p>

      {/* Info */}
      <div className="space-y-2 text-xs text-zinc-500 mb-8">
        <p>© 2024 Yuxi Labs</p>
        <p>Built with Tauri, React, and Python</p>
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <a
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
        >
          <Github className="w-4 h-4" />
          GitHub
        </a>
        <a
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Documentation
        </a>
      </div>

      {/* Tech Stack */}
      <div className="mt-8 pt-6 border-t border-zinc-800 w-full max-w-sm">
        <p className="text-xs text-zinc-600 text-center mb-3">Built with</p>
        <div className="flex justify-center gap-4 text-xs text-zinc-500">
          <span>Tauri 2.0</span>
          <span>•</span>
          <span>React 18</span>
          <span>•</span>
          <span>FastAPI</span>
          <span>•</span>
          <span>Ray</span>
        </div>
      </div>
    </div>
  );
}


