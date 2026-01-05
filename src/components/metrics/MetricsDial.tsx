/**
 * MetricsDial - Circular gauge/dial component
 */

import { useMemo } from "react";

interface MetricsDialProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  showTicks?: boolean;
  animated?: boolean;
}

export function MetricsDial({
  value,
  max = 100,
  label,
  unit = "",
  size = "md",
  color = "#3b82f6",
  showTicks = true,
  animated = true,
}: MetricsDialProps) {
  const sizes = {
    sm: { width: 80, stroke: 6, fontSize: 12, labelSize: 8 },
    md: { width: 120, stroke: 8, fontSize: 18, labelSize: 10 },
    lg: { width: 160, stroke: 10, fontSize: 24, labelSize: 12 },
  };

  const { width, stroke, fontSize, labelSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference - percentage * circumference * 0.75; // 270 degree arc

  const ticks = useMemo(() => {
    if (!showTicks) return [];
    const tickCount = 10;
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const angle = -225 + (i * 270) / tickCount;
      const rad = (angle * Math.PI) / 180;
      const innerR = radius - 10;
      const outerR = radius - 4;
      return {
        x1: width / 2 + innerR * Math.cos(rad),
        y1: width / 2 + innerR * Math.sin(rad),
        x2: width / 2 + outerR * Math.cos(rad),
        y2: width / 2 + outerR * Math.sin(rad),
      };
    });
  }, [width, radius, showTicks]);

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={width} className="transform -rotate-[135deg]">
        {/* Background arc */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={stroke}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
        />
        
        {/* Ticks */}
        {showTicks && (
          <g className="transform rotate-[135deg] origin-center" style={{ transformOrigin: `${width/2}px ${width/2}px` }}>
            {ticks.map((tick, i) => (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#52525b"
                strokeWidth={1}
              />
            ))}
          </g>
        )}
        
        {/* Value arc */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={animated ? "transition-all duration-500 ease-out" : ""}
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
        
        {/* Center text */}
        <text
          x={width / 2}
          y={width / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="transform rotate-[135deg] fill-white font-bold"
          style={{ 
            fontSize,
            transformOrigin: `${width/2}px ${width/2}px`,
          }}
        >
          {typeof value === "number" ? value.toFixed(value < 10 ? 1 : 0) : value}
        </text>
        
        {unit && (
          <text
            x={width / 2}
            y={width / 2 + fontSize * 0.8}
            textAnchor="middle"
            className="transform rotate-[135deg] fill-zinc-500"
            style={{ 
              fontSize: labelSize,
              transformOrigin: `${width/2}px ${width/2}px`,
            }}
          >
            {unit}
          </text>
        )}
      </svg>
      
      <span className="mt-1 text-zinc-400" style={{ fontSize: labelSize }}>
        {label}
      </span>
    </div>
  );
}

/**
 * Mini progress bar for compact displays
 */
interface MiniProgressProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  showValue?: boolean;
}

export function MiniProgress({
  value,
  max = 100,
  label,
  color = "#3b82f6",
  showValue = true,
}: MiniProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] text-zinc-500 w-16 truncate">{label}</span>}
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
      {showValue && (
        <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

/**
 * Vertical meter bar
 */
interface VerticalMeterProps {
  value: number;
  max?: number;
  label: string;
  color?: string;
  height?: number;
  showScale?: boolean;
}

export function VerticalMeter({
  value,
  max = 100,
  label,
  color = "#22c55e",
  height = 80,
  showScale = false,
}: VerticalMeterProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="relative w-4 bg-zinc-800 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-300"
          style={{
            height: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}50`,
          }}
        />
        {showScale && (
          <>
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className="absolute left-full ml-1 w-1 h-px bg-zinc-600"
                style={{ bottom: `${tick}%` }}
              />
            ))}
          </>
        )}
      </div>
      <span className="text-[9px] text-zinc-500 text-center leading-tight">{label}</span>
      <span className="text-[10px] font-mono text-zinc-300">{value.toFixed(0)}</span>
    </div>
  );
}

