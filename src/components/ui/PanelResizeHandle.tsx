interface PanelResizeHandleProps {
  orientation?: "vertical" | "horizontal";
}

export function PanelResizeHandle({ orientation = "vertical" }: PanelResizeHandleProps) {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={`
        flex-shrink-0 group cursor-${isVertical ? "col" : "row"}-resize
        ${isVertical ? "w-1 hover:w-1" : "h-1 hover:h-1"}
        transition-colors
      `}
    >
      <div
        className={`
          ${isVertical ? "w-full h-full" : "w-full h-full"}
          bg-transparent group-hover:bg-[var(--color-primary)]
          transition-colors
        `}
      />
    </div>
  );
}
