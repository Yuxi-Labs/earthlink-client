/**
 * Experiment Designer Window
 * 
 * Configure and run controlled experiments:
 * - Agent configuration (count, initial parameters)
 * - Environment settings (novelty, data sources)
 * - Hypothesis documentation
 * - Duration and stopping conditions
 * - Data collection settings
 */

import { useState } from "react";
import {
  FlaskConical,
  Users,
  Settings,
  FileText,
  Clock,
  Database,
  Play,
  Save,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import "@/App.css";

export function ExperimentDesignerWindow() {
  const [activeTab, setActiveTab] = useState<"basic" | "agents" | "environment" | "hypothesis" | "collection">("basic");
  
  // Form state
  const [experimentName, setExperimentName] = useState("");
  const [description, setDescription] = useState("");
  const [agentCount, setAgentCount] = useState(5);
  const [duration, setDuration] = useState(10000);
  const [curiosityWeight, setCuriosityWeight] = useState(0.7);
  const [learningRate, setLearningRate] = useState(0.01);
  const [explorationBias, setExplorationBias] = useState(0.6);
  const [noveltyLevel, setNoveltyLevel] = useState(0.5);
  const [hypothesis, setHypothesis] = useState("");
  const [collectMetrics, setCollectMetrics] = useState(true);
  const [collectDecisions, setCollectDecisions] = useState(true);
  const [collectMemory, setCollectMemory] = useState(false);

  const tabs = [
    { id: "basic", label: "Basic", icon: FlaskConical },
    { id: "agents", label: "Agents", icon: Users },
    { id: "environment", label: "Environment", icon: Settings },
    { id: "hypothesis", label: "Hypothesis", icon: FileText },
    { id: "collection", label: "Data Collection", icon: Database },
  ] as const;

  const handleRunExperiment = () => {
    // TODO: Wire to backend
    console.log("Running experiment:", {
      experimentName,
      description,
      agentCount,
      duration,
      curiosityWeight,
      learningRate,
      explorationBias,
      noveltyLevel,
      hypothesis,
      collectMetrics,
      collectDecisions,
      collectMemory,
    });
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-semibold">Experiment Designer</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
              <FolderOpen className="w-4 h-4" />
              Load
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleRunExperiment}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
            >
              <Play className="w-4 h-4" />
              Run Experiment
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="shrink-0 px-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "basic" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Experiment Name</label>
              <input
                type="text"
                value={experimentName}
                onChange={e => setExperimentName(e.target.value)}
                placeholder="e.g., Curiosity vs Goal-Directed Exploration"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what this experiment aims to test..."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (ticks)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value) || 0)}
                  min={100}
                  max={1000000}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Agent Count
                </label>
                <input
                  type="number"
                  value={agentCount}
                  onChange={e => setAgentCount(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="max-w-2xl space-y-6">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Initial Agent Parameters</h3>
              
              <div className="space-y-4">
                <SliderField
                  label="Curiosity Weight"
                  value={curiosityWeight}
                  onChange={setCuriosityWeight}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <SliderField
                  label="Learning Rate"
                  value={learningRate}
                  onChange={setLearningRate}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                />
                <SliderField
                  label="Exploration Bias"
                  value={explorationBias}
                  onChange={setExplorationBias}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">
                All agents will start with these parameters. Individual agents will adapt over time based on their experiences.
              </p>
            </div>
          </div>
        )}

        {activeTab === "environment" && (
          <div className="max-w-2xl space-y-6">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Environment Settings</h3>
              
              <SliderField
                label="Novelty Level"
                value={noveltyLevel}
                onChange={setNoveltyLevel}
                min={0}
                max={1}
                step={0.01}
              />
              <p className="text-xs text-zinc-600 mt-1 mb-4">
                Higher novelty introduces more unfamiliar data patterns to test generalization.
              </p>

              <h4 className="text-sm font-medium text-zinc-400 mb-2">Data Sources</h4>
              <div className="space-y-2">
                {["Wikipedia", "OpenStreetMap", "Ollama LLM", "DuckDuckGo"].map(source => (
                  <label key={source} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500" />
                    <span className="text-sm text-zinc-300">{source}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "hypothesis" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Research Hypothesis</label>
              <textarea
                value={hypothesis}
                onChange={e => setHypothesis(e.target.value)}
                placeholder="State your hypothesis in a specific, testable, and falsifiable form...

Example: 'Agents with higher curiosity weight (>0.7) will acquire 50% more knowledge items than agents with lower curiosity weight (<0.3) over the same number of ticks, but will show lower goal completion rates.'"
                rows={8}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <p className="text-sm font-medium mb-1">Tips for good hypotheses:</p>
              <ul className="text-xs space-y-1 text-amber-400/80">
                <li>• Be specific about the variables you're testing</li>
                <li>• Include measurable outcomes (numbers, percentages)</li>
                <li>• Make it falsifiable - what result would disprove it?</li>
                <li>• Consider confounding variables</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "collection" && (
          <div className="max-w-2xl space-y-6">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Data Collection Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-zinc-300">Collect Metrics</span>
                    <p className="text-xs text-zinc-600">Knowledge, distance, curiosity, rewards, etc.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={collectMetrics}
                    onChange={e => setCollectMetrics(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-zinc-300">Collect Decisions</span>
                    <p className="text-xs text-zinc-600">Action choices, reasoning traces, confidence scores</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={collectDecisions}
                    onChange={e => setCollectDecisions(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm text-zinc-300">Collect Memory Snapshots</span>
                    <p className="text-xs text-zinc-600">Full memory state at intervals (large files)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={collectMemory}
                    onChange={e => setCollectMemory(e.target.checked)}
                    className="rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Export Format</h3>
              <div className="flex gap-2">
                {["CSV", "JSON", "Parquet"].map(format => (
                  <button
                    key={format}
                    className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-zinc-300">{label}</label>
        <span className="text-sm font-mono text-zinc-400">{value.toFixed(step < 0.01 ? 3 : 2)}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
      />
    </div>
  );
}


