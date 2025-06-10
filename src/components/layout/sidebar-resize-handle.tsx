import React from "react";

import { cn } from "@/lib/utils";

interface SidebarResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export function SidebarResizeHandle({
  onMouseDown,
  className,
}: SidebarResizeHandleProps) {
  // Determine if this is a left or right handle based on className
  const isLeftHandle = className?.includes("left-0");
  const [isActive, setIsActive] = React.useState(false);

  // Handle mouse down and up to show active state
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsActive(true);
    // Add a mouseup listener to the document
    const handleMouseUp = () => {
      setIsActive(false);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);

    // Call the original onMouseDown handler
    onMouseDown(e);
  };

  return (
    <div
      className={cn(
        "absolute top-0 h-full cursor-ew-resize group flex items-center justify-center sidebar-resize-handle",
        // Default right positioning unless override is provided in className
        !isLeftHandle && "right-0",
        // Make the handle area wider for better interaction while maintaining visual width
        isLeftHandle ? "w-[8px]" : "w-[8px] -mr-[4px]",
        // Ensure high z-index to capture events
        "z-[100]",
        // Add the active state as a class to allow styling
        isActive && "is-resizing",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator - remains 3px wide */}
      <div
        className={cn(
          "w-[3px] h-full bg-gradient-to-b from-emerald-400/50 via-emerald-500/40 to-emerald-400/50 backdrop-blur-sm rounded-full",
          // Show on hover, active state, or when actively resizing
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-active:opacity-100",
          "transition-opacity duration-200"
        )}
      ></div>
      <div
        className={cn(
          "absolute w-[3px] h-24 top-1/2 -translate-y-1/2 bg-gradient-to-b from-emerald-400/60 via-emerald-500/50 to-emerald-400/60 shadow-[0_0_8px_rgba(71,216,163,0.6)] rounded-full",
          // Show on hover, active state, or when actively resizing
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-active:opacity-100",
          "transition-opacity duration-300"
        )}
      ></div>
    </div>
  );
}
