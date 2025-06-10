// split-layout.tsx
import React, { useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { useAccount } from "wagmi";

import { cn } from "@/lib/utils";

import { TabType, useTab } from "@/contexts/tab-context";

import {
  MAX_LEFT_WIDTH,
  MAX_RIGHT_WIDTH,
  MIN_LEFT_WIDTH,
  MIN_RIGHT_WIDTH,
  useSplitLayout,
} from "../../contexts/split-layout-context";
import { SavedMessagesSidebar } from "../left-sidebar/LeftSidebar";
import { RightPanelTabs } from "../right-sidebar/right-panel-tabs";
import { RightPanelToggleButtons } from "../right-sidebar/right-panel-toggle-buttons";
import LeftPanelToggleButtons from "./left-panel-toggle-buttons";
import { MobileOverlay } from "./mobile-overlay";
import { SidebarResizeHandle } from "./sidebar-resize-handle";

interface SplitLayoutProps {
  children: React.ReactNode;
}

export function SplitLayout({ children }: SplitLayoutProps) {
  const { isConnected } = useAccount();
  const {
    leftSidebarWidth,
    isLeftSidebarExpanded,
    isLeftResizing,
    setLeftSidebarWidth,
    setIsLeftResizing,
    toggleLeftSidebar,
    rightPanelWidth,
    isRightResizing,
    setRightPanelWidth,
    setIsRightResizing,
    isRightSidebarExpanded,
    setIsRightSidebarExpanded,
    closeRightSidebar,
  } = useSplitLayout();

  const [activeTab, setActiveTab] = useTab();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // Determine what page we're on
  const isProfilePage = pathname === "/profile";
  const isHomePage = pathname === "/";
  const isChatPage = pathname.startsWith("/chat/");

  // Set mobile state based on window width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    if (typeof window !== "undefined") {
      checkMobile();
      window.addEventListener("resize", checkMobile);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkMobile);
      }
    };
  }, []);

  // Control body overflow when sidebars are open on mobile
  useEffect(() => {
    if (typeof document !== "undefined") {
      // Prevent body scrolling when mobile sidebar is open
      if ((isLeftSidebarExpanded || isRightSidebarExpanded) && isMobile) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };
  }, [isLeftSidebarExpanded, isRightSidebarExpanded, isMobile]);

  const handleClose = () => {
    // Reset to no active tab
    setActiveTab("" as any);

    // Use the context's closeRightSidebar which handles width reset
    closeRightSidebar();

    // Ensure the user can close the sidebar even for token analytics
    document.body.click(); // Force any click handlers to reset
  };

  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLeftResizing(true);
  };

  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRightResizing(true);
  };

  // Track current width in a ref during resizing to avoid state updates on every mouse move
  const currentWidthRef = useRef({
    left: leftSidebarWidth,
    right: rightPanelWidth,
  });

  // Update the ref when the actual state changes (not during resize)
  useEffect(() => {
    if (!isLeftResizing && !isRightResizing) {
      currentWidthRef.current.left = leftSidebarWidth;
      currentWidthRef.current.right = rightPanelWidth;
    }
  }, [leftSidebarWidth, rightPanelWidth, isLeftResizing, isRightResizing]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother resizing that doesn't block the UI
    let animationFrameId: number;
    let lastUpdateTime = 0;
    const THROTTLE_INTERVAL = 50; // Only update state every 50ms during resize

    const handleMouseMove = (e: MouseEvent) => {
      // Always update the ref on every mouse move for smoothness
      if (isLeftResizing) {
        currentWidthRef.current.left = Math.max(
          MIN_LEFT_WIDTH,
          Math.min(e.clientX, MAX_LEFT_WIDTH)
        );
      }
      if (isRightResizing) {
        currentWidthRef.current.right = Math.max(
          MIN_RIGHT_WIDTH,
          Math.min(window.innerWidth - e.clientX, MAX_RIGHT_WIDTH)
        );
      }

      // Throttle actual state updates
      const now = Date.now();
      if (now - lastUpdateTime >= THROTTLE_INTERVAL) {
        lastUpdateTime = now;

        // Use requestAnimationFrame to optimize rendering
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          if (isLeftResizing) {
            setLeftSidebarWidth(currentWidthRef.current.left);
          }
          if (isRightResizing) {
            setRightPanelWidth(currentWidthRef.current.right);
          }
        });
      }
    };

    const handleMouseUp = () => {
      // Final update on mouse up
      cancelAnimationFrame(animationFrameId);

      if (isLeftResizing) {
        setLeftSidebarWidth(currentWidthRef.current.left);
      }
      if (isRightResizing) {
        setRightPanelWidth(currentWidthRef.current.right);
      }

      setIsLeftResizing(false);
      setIsRightResizing(false);
    };

    if (isLeftResizing || isRightResizing) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: true,
      });
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isLeftResizing,
    isRightResizing,
    setLeftSidebarWidth,
    setRightPanelWidth,
    setIsLeftResizing,
    setIsRightResizing,
  ]);

  const handleOpenTab = (tab: TabType) => {
    setIsRightSidebarExpanded(true);
    setActiveTab(tab);
  };

  // If on homepage, ensure right sidebar is closed
  if (isHomePage && isRightSidebarExpanded) {
    closeRightSidebar();
    setActiveTab("" as any);
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Hover trigger removed since we now have explicit buttons */}

      {/* Left Floating Toolbar - Desktop Only - Vertical version */}
      {isConnected && !isLeftSidebarExpanded && !isMobile && !isProfilePage && (
        <div
          className={cn(
            "fixed top-[65px] left-4 z-50 bg-background/90 backdrop-blur-md rounded-full border border-gray-800/20 dark:border-gray-700/40 w-10",
            "flex items-center justify-center py-1.5 px-0 transition-all duration-300 ease-in-out",
            "animate-in slide-in-from-left-4 fade-in"
          )}
        >
          <div className="bg-gradient-to-b from-primary/5 to-transparent absolute inset-0 rounded-full pointer-events-none opacity-50"></div>
          <LeftPanelToggleButtons orientation="vertical" />
        </div>
      )}

      {/* Overlay for both mobile and desktop for left sidebar */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-50",
          isLeftSidebarExpanded
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        )}
        onClick={toggleLeftSidebar}
        style={{
          transition: "opacity 0.3s ease-in-out",
        }}
      />
      <MobileOverlay isVisible={isRightSidebarExpanded} onClick={handleClose} />

      {isConnected && (
        <div
          className={cn(
            "relative h-full transition-all duration-500 ease-in-out",
            "bg-white dark:bg-neutral-900",
            isLeftSidebarExpanded
              ? "border-r border-gray-200/60 dark:border-gray-800/40 opacity-100"
              : "opacity-0",
            isLeftResizing && "transition-none",
            "fixed top-0 left-0 z-[70]",
            // Add shadow when expanded
            isLeftSidebarExpanded && "shadow-xl",
            // Transform for animation
            !isLeftSidebarExpanded && "-translate-x-full",
            // Visibility but keep in DOM for animations
            !isLeftSidebarExpanded && "invisible"
          )}
          style={{
            width: isLeftSidebarExpanded ? `${leftSidebarWidth}px` : "64px",
            overflow: "hidden", // Prevent content overflow during transition
            willChange: "width, transform, opacity", // Optimize for animations
            height: "100%", // Ensure full height
            maxWidth: "85vw", // Prevent sidebar from taking up too much space
            pointerEvents: isLeftSidebarExpanded ? "auto" : "none", // Disable interaction when collapsed
          }}
        >
          {/* Expanded state content - keep visible during resizing */}
          <div
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-300",
              isLeftSidebarExpanded ? "opacity-100" : "opacity-0",
              // Only hide when completely collapsed
              !isLeftSidebarExpanded && "invisible"
            )}
            style={{
              // Only add delay when transitioning to expanded (not for resizing)
              transitionDelay:
                isLeftSidebarExpanded && !isLeftResizing ? "150ms" : "0ms",
              // Fixed minimum width to prevent squishing
              minWidth: "240px",
            }}
          >
            <SavedMessagesSidebar />
            <SidebarResizeHandle
              onMouseDown={handleLeftMouseDown}
              className="hidden md:block"
            />
          </div>

          {/* Collapsed state content removed - no longer needed */}

          {/* Mobile collapsed state - hidden */}
          <div className="md:hidden w-0 h-0 opacity-0 invisible"></div>
        </div>
      )}

      <div
        className="flex-1 min-w-0 relative transition-all duration-500 ease-in-out overflow-hidden"
        style={{
          // Removed marginLeft for desktop to allow sidebar to fully overlap
          // Only adjust margin for right sidebar on desktop
          marginRight:
            isRightSidebarExpanded && !isMobile ? `${rightPanelWidth}px` : 0,
          // On desktop, only adjust width for right sidebar
          width: !isMobile
            ? `calc(100% ${isRightSidebarExpanded ? `- ${rightPanelWidth}px` : ""})`
            : "100%",
          transition:
            isLeftResizing || isRightResizing ? "none" : "all 0.5s ease-in-out",
          // Hide main content when right sidebar is open on mobile
          display: isRightSidebarExpanded && isMobile ? "none" : "block",
        }}
      >
        {children}
      </div>

      {/* Right Toolbar - Desktop Only - Vertical version - Hidden on HomePage - Shown for all chat pages (even public) */}
      {!isRightSidebarExpanded && !isMobile && isChatPage && (
        <div
          className={cn(
            "fixed top-[65px] right-4 z-50 bg-background/90 backdrop-blur-md rounded-full border border-gray-800/20 dark:border-gray-700/40 w-10",
            "flex items-center justify-center py-1.5 px-0 transition-all duration-300 ease-in-out",
            "animate-in slide-in-from-right-4 fade-in"
          )}
        >
          <div className="bg-gradient-to-b from-primary/5 to-transparent absolute inset-0 rounded-full pointer-events-none opacity-50"></div>
          <RightPanelToggleButtons
            onOpenTab={handleOpenTab}
            orientation="vertical"
          />
        </div>
      )}

      {/* Main Right Sidebar - Available for all chat pages (even public) */}
      {isChatPage && (
        <div
          className={cn(
            "relative h-full transition-all duration-500 ease-in-out overflow-hidden",
            "bg-white/95 dark:bg-neutral-800 backdrop-blur-md",
            isRightSidebarExpanded
              ? "border-l border-gray-200/60 dark:border-gray-800/40 opacity-100"
              : "opacity-0",
            isRightResizing && "transition-none",
            "absolute top-0 right-0 z-50",
            isRightSidebarExpanded && "shadow-xl",
            // Transform for animation
            !isRightSidebarExpanded && "translate-x-full",
            // Visibility but keep in DOM for animations
            !isRightSidebarExpanded && "invisible",
            // Different width handling for mobile vs desktop
            isRightSidebarExpanded && isMobile ? "w-full" : "md:w-auto"
          )}
          style={{
            width: isRightSidebarExpanded
              ? // On mobile use 100% width, on desktop use the configured width
                isMobile
                ? "100%"
                : `${rightPanelWidth}px`
              : "64px",
            overflow: "hidden", // Prevent content overflow during transition
            willChange: "width, transform, opacity", // Optimize for animations
            height: "100%", // Ensure full height
            maxWidth:
              isMobile && isRightSidebarExpanded
                ? "100%"
                : isMobile
                  ? "80px"
                  : "1000px", // Allow up to 1000px width (fixed value instead of relative)
            pointerEvents: isRightSidebarExpanded ? "auto" : "none", // Disable interaction when collapsed
            overscrollBehavior: "contain", // Prevent scroll chaining
            overflowX: "hidden", // Prevent horizontal overflow
          }}
        >
          {/* Expanded state content - keep visible during resizing */}
          <div
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-300 relative",
              isRightSidebarExpanded ? "opacity-100" : "opacity-0",
              // Only hide when completely collapsed
              !isRightSidebarExpanded && "invisible",
              // Full width on mobile
              "md:w-auto w-full overflow-x-hidden"
            )}
            style={{
              // Only add delay when transitioning to expanded (not for resizing)
              transitionDelay:
                isRightSidebarExpanded && !isRightResizing ? "150ms" : "0ms",
              // Use safe width values to prevent overflow
              width: isMobile ? "100%" : "auto",
              maxWidth: "100%",
              position: "relative", // Ensure relative positioning
            }}
          >
            {/* Position the handle element directly in the DOM for better behavior */}
            <div className="absolute left-0 top-0 h-full">
              <SidebarResizeHandle
                onMouseDown={handleRightMouseDown}
                className="left-0 hidden md:block"
              />
            </div>
            <RightPanelTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onClose={handleClose}
            />
          </div>

          {/* Collapsed state content - Only visible on desktop */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 hidden md:block",
              !isRightSidebarExpanded ? "opacity-100" : "opacity-0",
              isRightSidebarExpanded && "invisible"
            )}
          >
            {isChatPage && (
              <RightPanelToggleButtons
                onOpenTab={handleOpenTab}
                orientation="vertical"
              />
            )}
          </div>

          {/* Mobile collapsed state - hidden */}
          <div className="md:hidden w-0 h-0 opacity-0 invisible"></div>
        </div>
      )}
    </div>
  );
}
