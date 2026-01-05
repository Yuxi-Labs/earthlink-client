/**
 * FloatingPanel - Draggable, collapsible floating panel
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minus, Maximize2, GripVertical } from "lucide-react";

interface FloatingPanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  collapsible?: boolean;
  closable?: boolean;
  className?: string;
  headerClassName?: string;
  onClose?: () => void;
}

export function FloatingPanel({
  title,
  icon,
  children,
  defaultPosition = { x: 20, y: 80 },
  defaultSize = { width: 280, height: 200 },
  minWidth = 200,
  minHeight = 100,
  collapsible = true,
  closable = true,
  className = "",
  headerClassName = "",
  onClose,
}: FloatingPanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-controls')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.current.x),
          y: Math.max(0, e.clientY - dragOffset.current.y),
        });
      }
      if (isResizing && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setSize({
          width: Math.max(minWidth, e.clientX - rect.left),
          height: Math.max(minHeight, e.clientY - rect.top),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, minWidth, minHeight]);

  return (
    <div
      ref={panelRef}
      className={`fixed z-40 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: isCollapsed ? size.width : size.width,
        height: isCollapsed ? "auto" : size.height,
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-zinc-800/80 cursor-move select-none ${headerClassName}`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-3 h-3 text-zinc-500" />
        {icon && <span className="text-zinc-400">{icon}</span>}
        <span className="flex-1 text-xs font-medium text-zinc-200 truncate">{title}</span>
        
        <div className="panel-controls flex items-center gap-1">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded transition-colors"
            >
              {isCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            </button>
          )}
          {closable && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="relative" style={{ height: size.height - 36 }}>
          <div className="absolute inset-0 overflow-auto p-2">
            {children}
          </div>
          
          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          >
            <svg className="w-full h-full text-zinc-600" viewBox="0 0 16 16">
              <path d="M14 14L14 8M14 14L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

