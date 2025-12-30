import { BarChart3, TrendingUp, Activity, Brain, Zap, Clock } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  Tooltip,
} from "recharts";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

function MetricCard({ icon, label, value, trend, color }: MetricCardProps) {
  return (
    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
        <span className={color || "text-[var(--color-text-muted)]"}>{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold text-[var(--color-text-primary)]">{value}</span>
        {trend && (
          <TrendingUp 
            className={`w-4 h-4 ${
              trend === "up" ? "text-[var(--color-success)]" : 
              trend === "down" ? "text-[var(--color-error)] rotate-180" : 
              "text-[var(--color-text-muted)]"
            }`} 
          />
        )}
      </div>
    </div>
  );
}

interface ChartData {
  name: string;
  value: number;
}

interface MetricChartProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  data: ChartData[];
  color: string;
  gradientId: string;
}

function MetricChart({ icon, label, value, data, color, gradientId }: MetricChartProps) {
  return (
    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
        </div>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
      </div>
      <div className="w-full" style={{ height: '80px', minHeight: '80px' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "var(--color-text-muted)" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MetricsPanel() {
  const { simulationTick, agentCount, simulationSpeed } = useAppStore();

  // Demo data for charts - formatted for Recharts
  const knowledgeData: ChartData[] = [
    { name: "1", value: 20 }, { name: "2", value: 25 }, { name: "3", value: 30 },
    { name: "4", value: 28 }, { name: "5", value: 35 }, { name: "6", value: 42 },
    { name: "7", value: 45 }, { name: "8", value: 50 }, { name: "9", value: 55 },
    { name: "10", value: 60 }, { name: "11", value: 58 }, { name: "12", value: 65 },
  ];
  
  const curiosityData: ChartData[] = [
    { name: "1", value: 80 }, { name: "2", value: 75 }, { name: "3", value: 78 },
    { name: "4", value: 82 }, { name: "5", value: 70 }, { name: "6", value: 68 },
    { name: "7", value: 72 }, { name: "8", value: 65 }, { name: "9", value: 70 },
    { name: "10", value: 75 }, { name: "11", value: 78 }, { name: "12", value: 80 },
  ];
  
  const activityData: ChartData[] = [
    { name: "1", value: 5 }, { name: "2", value: 8 }, { name: "3", value: 12 },
    { name: "4", value: 15 }, { name: "5", value: 10 }, { name: "6", value: 8 },
    { name: "7", value: 12 }, { name: "8", value: 18 }, { name: "9", value: 22 },
    { name: "10", value: 20 }, { name: "11", value: 25 }, { name: "12", value: 28 },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <BarChart3 className="w-4 h-4" />
          <span>Metrics</span>
        </div>
      </div>

      {/* Metrics Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0 min-w-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard 
            icon={<Activity className="w-4 h-4" />}
            label="Tick Rate"
            value={`${(simulationSpeed * 10).toFixed(0)}/s`}
            trend="up"
          />
          <MetricCard 
            icon={<Clock className="w-4 h-4" />}
            label="Uptime"
            value={`${Math.floor(simulationTick / 60)}m`}
            color="text-[var(--color-primary)]"
          />
        </div>

        {/* Knowledge Chart */}
        <MetricChart
          icon={<Brain className="w-4 h-4 text-[#00c8ff]" />}
          label="Knowledge Growth"
          value="+15%"
          data={knowledgeData}
          color="#00c8ff"
          gradientId="knowledgeGradient"
        />

        {/* Curiosity Chart */}
        <MetricChart
          icon={<Zap className="w-4 h-4 text-[#00c896]" />}
          label="Curiosity Levels"
          value="78%"
          data={curiosityData}
          color="#00c896"
          gradientId="curiosityGradient"
        />

        {/* Activity Chart */}
        <MetricChart
          icon={<Activity className="w-4 h-4 text-[#a78bfa]" />}
          label="Agent Activity"
          value={`${agentCount} active`}
          data={activityData}
          color="#a78bfa"
          gradientId="activityGradient"
        />

        {/* System Stats */}
        <div className="text-xs text-[var(--color-text-muted)] space-y-1">
          <div className="flex justify-between">
            <span>Memory Usage</span>
            <span>256 MB</span>
          </div>
          <div className="flex justify-between">
            <span>WebSocket Msgs</span>
            <span>1,234/s</span>
          </div>
          <div className="flex justify-between">
            <span>Geo Features</span>
            <span>15.6M</span>
          </div>
        </div>
      </div>
    </div>
  );
}
