import { useMemo } from "react";
import { useAppStore } from "@/stores/appStore";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number; // 0-1
}

// Australia bounding box
const BOUNDS = {
  minLon: 110,
  maxLon: 155,
  minLat: -45,
  maxLat: -10,
};

const GRID_SIZE = 20; // 20x20 grid

export function ExplorationHeatmap() {
  const { agents } = useAppStore();

  const heatmapData = useMemo(() => {
    // Create empty grid
    const grid: number[][] = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(0)
    );

    // Count agent visits per cell (using current positions as proxy)
    agents.forEach((agent) => {
      const loc = agent.location;
      if (loc && Array.isArray(loc) && loc.length >= 2) {
        const [lon, lat] = loc as [number, number];
        // Convert to grid coordinates
        const x = Math.floor(
          ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * GRID_SIZE
        );
        const y = Math.floor(
          ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * GRID_SIZE
        );
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          grid[y][x] += 1;
        }
      }
    });

    // Normalize and convert to cells
    const maxCount = Math.max(1, ...grid.flat());
    const cells: HeatmapCell[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] > 0) {
          cells.push({
            x,
            y,
            intensity: grid[y][x] / maxCount,
          });
        }
      }
    }

    return cells;
  }, [agents]);

  // Calculate coverage percentage
  const coverage = useMemo(() => {
    const visitedCells = heatmapData.length;
    const totalCells = GRID_SIZE * GRID_SIZE;
    return ((visitedCells / totalCells) * 100).toFixed(1);
  }, [heatmapData]);

  const cellWidth = 100 / GRID_SIZE;
  const cellHeight = 100 / GRID_SIZE;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Heatmap overlay */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {heatmapData.map((cell, i) => (
          <rect
            key={i}
            x={`${cell.x * cellWidth}%`}
            y={`${(GRID_SIZE - 1 - cell.y) * cellHeight}%`}
            width={`${cellWidth}%`}
            height={`${cellHeight}%`}
            fill={`rgba(59, 130, 246, ${cell.intensity * 0.6})`}
            className="transition-opacity duration-300"
          />
        ))}
      </svg>

      {/* Coverage indicator */}
      <div className="absolute top-4 right-4 bg-zinc-900/95 border border-zinc-800 rounded-lg px-3 py-2 pointer-events-auto">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
          Exploration Coverage
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold text-zinc-200">{coverage}</span>
          <span className="text-xs text-zinc-500">%</span>
        </div>
        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

