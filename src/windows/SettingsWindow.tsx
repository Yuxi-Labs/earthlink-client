/**
 * Settings Window
 * 
 * Comprehensive preferences like Affinity/VS Code:
 * - Categorized sidebar navigation
 * - Search functionality
 * - All app configuration in one place
 */

import { useState } from "react";
import {
  Settings,
  Search,
  Palette,
  Cpu,
  Database,
  Globe,
  Bell,
  Shield,
  Plug,
  Monitor,
  Zap,
} from "lucide-react";
import "@/App.css";

type SettingsCategory = 
  | "general"
  | "appearance"
  | "performance"
  | "data-sources"
  | "simulation"
  | "notifications"
  | "privacy"
  | "api"
  | "display"
  | "advanced";

interface CategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryConfig[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "display", label: "Display", icon: Monitor },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "simulation", label: "Simulation", icon: Cpu },
  { id: "data-sources", label: "Data Sources", icon: Database },
  { id: "api", label: "API & Connections", icon: Plug },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "advanced", label: "Advanced", icon: Globe },
];

export function SettingsWindow() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const [search, setSearch] = useState("");

  const filteredCategories = search.trim()
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800 rounded-lg">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search settings..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <nav className="flex-1 overflow-auto py-2">
          {filteredCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                activeCategory === category.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.label}
            </button>
          ))}
        </nav>

        {/* Version */}
        <div className="p-3 border-t border-zinc-800 text-xs text-zinc-600">
          Earthlink v0.1.0
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeCategory === "general" && <GeneralSettings />}
        {activeCategory === "appearance" && <AppearanceSettings />}
        {activeCategory === "display" && <DisplaySettings />}
        {activeCategory === "performance" && <PerformanceSettings />}
        {activeCategory === "simulation" && <SimulationSettings />}
        {activeCategory === "data-sources" && <DataSourcesSettings />}
        {activeCategory === "api" && <APISettings />}
        {activeCategory === "notifications" && <NotificationsSettings />}
        {activeCategory === "privacy" && <PrivacySettings />}
        {activeCategory === "advanced" && <AdvancedSettings />}
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS PANELS
// ============================================================================

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm text-zinc-200">{label}</div>
        {description && <div className="text-xs text-zinc-500 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-zinc-700"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function GeneralSettings() {
  const [autoSave, setAutoSave] = useState(true);
  const [confirmExit, setConfirmExit] = useState(true);
  const [restoreWindows, setRestoreWindows] = useState(true);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">General</h2>
      
      <SettingsSection title="Startup">
        <SettingRow label="Restore windows on startup" description="Reopen windows that were open when you last quit">
          <Toggle checked={restoreWindows} onChange={setRestoreWindows} />
        </SettingRow>
        <SettingRow label="Auto-connect to backend" description="Automatically connect to the simulation backend">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Saving">
        <SettingRow label="Auto-save experiments" description="Automatically save experiment state periodically">
          <Toggle checked={autoSave} onChange={setAutoSave} />
        </SettingRow>
        <SettingRow label="Auto-save interval">
          <Select
            value="5"
            onChange={() => {}}
            options={[
              { value: "1", label: "1 minute" },
              { value: "5", label: "5 minutes" },
              { value: "10", label: "10 minutes" },
              { value: "30", label: "30 minutes" },
            ]}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Behavior">
        <SettingRow label="Confirm before exit" description="Show confirmation dialog when closing with unsaved changes">
          <Toggle checked={confirmExit} onChange={setConfirmExit} />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("blue");

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Appearance</h2>
      
      <SettingsSection title="Theme">
        <SettingRow label="Color theme">
          <Select
            value={theme}
            onChange={setTheme}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
              { value: "system", label: "System" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Accent color">
          <div className="flex gap-2">
            {["blue", "violet", "emerald", "amber", "rose"].map(color => (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  accentColor === color ? "border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: `var(--color-${color}-500, ${color})` }}
              />
            ))}
          </div>
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Font">
        <SettingRow label="UI font size">
          <Select
            value="medium"
            onChange={() => {}}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Monospace font">
          <Select
            value="jetbrains"
            onChange={() => {}}
            options={[
              { value: "jetbrains", label: "JetBrains Mono" },
              { value: "fira", label: "Fira Code" },
              { value: "cascadia", label: "Cascadia Code" },
              { value: "system", label: "System Default" },
            ]}
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function DisplaySettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Display</h2>
      
      <SettingsSection title="Map">
        <SettingRow label="Default view mode">
          <Select
            value="2.5d"
            onChange={() => {}}
            options={[
              { value: "2d", label: "2D Map" },
              { value: "2.5d", label: "2.5D Perspective" },
              { value: "3d", label: "3D Globe" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Show agent trails" description="Display movement history trails for agents">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Show signal bursts" description="Visualize agent communications">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Agents">
        <SettingRow label="Agent label display">
          <Select
            value="hover"
            onChange={() => {}}
            options={[
              { value: "always", label: "Always" },
              { value: "hover", label: "On hover" },
              { value: "never", label: "Never" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Agent size">
          <Select
            value="medium"
            onChange={() => {}}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function PerformanceSettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Performance</h2>
      
      <SettingsSection title="Rendering">
        <SettingRow label="Hardware acceleration" description="Use GPU for rendering (recommended)">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Max frame rate">
          <Select
            value="60"
            onChange={() => {}}
            options={[
              { value: "30", label: "30 FPS" },
              { value: "60", label: "60 FPS" },
              { value: "120", label: "120 FPS" },
              { value: "unlimited", label: "Unlimited" },
            ]}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingRow label="Update interval" description="How often to fetch data from backend">
          <Select
            value="1000"
            onChange={() => {}}
            options={[
              { value: "500", label: "500ms" },
              { value: "1000", label: "1 second" },
              { value: "2000", label: "2 seconds" },
              { value: "5000", label: "5 seconds" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Max agents to render" description="Limit for performance on large simulations">
          <Select
            value="1000"
            onChange={() => {}}
            options={[
              { value: "100", label: "100" },
              { value: "500", label: "500" },
              { value: "1000", label: "1000" },
              { value: "unlimited", label: "Unlimited" },
            ]}
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function SimulationSettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Simulation</h2>
      
      <SettingsSection title="Defaults">
        <SettingRow label="Default simulation speed">
          <Select
            value="1"
            onChange={() => {}}
            options={[
              { value: "0.5", label: "0.5x" },
              { value: "1", label: "1x" },
              { value: "2", label: "2x" },
              { value: "5", label: "5x" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Auto-start on connect" description="Start simulation when backend connects">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Agents">
        <SettingRow label="Default curiosity weight">
          <input 
            type="number" 
            defaultValue="0.7" 
            step="0.1" 
            min="0" 
            max="1"
            className="w-20 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200"
          />
        </SettingRow>
        <SettingRow label="Default learning rate">
          <input 
            type="number" 
            defaultValue="0.01" 
            step="0.001"
            className="w-20 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200"
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function DataSourcesSettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Data Sources</h2>
      
      <SettingsSection title="Knowledge Sources">
        <SettingRow label="Wikipedia" description="Enable Wikipedia as knowledge source">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="OpenStreetMap" description="Enable OSM for geographic data">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="DuckDuckGo Search" description="Enable web search for agents">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="LLM">
        <SettingRow label="LLM Provider">
          <Select
            value="ollama"
            onChange={() => {}}
            options={[
              { value: "ollama", label: "Ollama (Local)" },
              { value: "openai", label: "OpenAI" },
              { value: "anthropic", label: "Anthropic" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Ollama endpoint">
          <input 
            type="text" 
            defaultValue="http://localhost:11434"
            className="w-56 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200"
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function APISettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">API & Connections</h2>
      
      <SettingsSection title="Backend">
        <SettingRow label="Backend URL">
          <input 
            type="text" 
            defaultValue="http://localhost:8000"
            className="w-56 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200"
          />
        </SettingRow>
        <SettingRow label="WebSocket URL">
          <input 
            type="text" 
            defaultValue="ws://localhost:8000/ws"
            className="w-56 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200"
          />
        </SettingRow>
        <SettingRow label="Auto-reconnect" description="Automatically reconnect when connection is lost">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function NotificationsSettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Notifications</h2>
      
      <SettingsSection title="Alerts">
        <SettingRow label="Show agent errors" description="Notify when agents encounter errors">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Show milestone achievements" description="Notify when agents reach milestones">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Connection status changes" description="Notify on connect/disconnect">
          <Toggle checked={true} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Privacy</h2>
      
      <SettingsSection title="Telemetry">
        <SettingRow label="Send anonymous usage data" description="Help improve Earthlink by sending anonymous usage statistics">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Send crash reports" description="Automatically send crash reports to help fix bugs">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingRow label="Clear local cache">
          <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-200 transition-colors">
            Clear Cache
          </button>
        </SettingRow>
        <SettingRow label="Clear experiment history">
          <button className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors">
            Clear History
          </button>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

function AdvancedSettings() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Advanced</h2>
      
      <SettingsSection title="Developer">
        <SettingRow label="Enable debug mode" description="Show additional debug information">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
        <SettingRow label="Log level">
          <Select
            value="info"
            onChange={() => {}}
            options={[
              { value: "error", label: "Error" },
              { value: "warn", label: "Warning" },
              { value: "info", label: "Info" },
              { value: "debug", label: "Debug" },
              { value: "trace", label: "Trace" },
            ]}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Experimental">
        <SettingRow label="Enable experimental features" description="Try new features that may be unstable">
          <Toggle checked={false} onChange={() => {}} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Reset">
        <SettingRow label="Reset all settings" description="Restore all settings to their default values">
          <button className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors">
            Reset All
          </button>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

