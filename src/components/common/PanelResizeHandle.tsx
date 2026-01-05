/**
 * PanelResizeHandle - Draggable resize handle for panels
 */

import { useCallback, useEffect, useState } from "react";

interface PanelResizeHandleProps {
  orientation: "horizontal" | "vertical";
  onResize: (delta: number) => void;
}

export function PanelResizeHandle({ orientation, onResize }: PanelResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos(orientation === "horizontal" ? e.clientY : e.clientX);
    e.preventDefault();
  }, [orientation]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = orientation === "horizontal" ? e.clientY : e.clientX;
      const delta = currentPos - startPos;
      onResize(delta);
      setStartPos(currentPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, orientation, onResize, startPos]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 transition-colors
        ${orientation === "horizontal" 
          ? "h-1 cursor-row-resize w-full" 
          : "w-1 cursor-col-resize h-full"
        }
        ${isDragging ? "bg-blue-500" : ""}
      `}
    />
  );
}

