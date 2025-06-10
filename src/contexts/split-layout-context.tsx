import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAccount } from "wagmi";

interface SplitLayoutContextType {
  // Left sidebar state
  leftSidebarWidth: number;
  isLeftSidebarExpanded: boolean;
  isLeftResizing: boolean;
  setLeftSidebarWidth: (width: number) => void;
  setIsLeftResizing: (isResizing: boolean) => void;
  toggleLeftSidebar: () => void;
  closeLeftSidebar: () => void;
  openLeftSidebar: () => void;

  // Right panel state
  rightPanelWidth: number;
  isRightResizing: boolean;
  isRightSidebarExpanded: boolean;
  setIsRightSidebarExpanded: (isExpanded: boolean) => void;
  setRightPanelWidth: (width: number) => void;
  setIsRightResizing: (isResizing: boolean) => void;
  closeRightSidebar: () => void;

  // Width management
  resetRightPanelToDefault: () => void;

  // Chat integration
  registerChatIdListener: (chatId: string) => void; // Register a chat ID change
}

export const MIN_LEFT_WIDTH = 200;
export const MAX_LEFT_WIDTH = 500;
export const MIN_RIGHT_WIDTH = 320;
export const MAX_RIGHT_WIDTH = 1000;

// Helper function to calculate default sidebar width based on screen size
export const getDefaultRightWidth = () => {
  if (typeof window === "undefined") return 420;

  if (window.innerWidth >= 768) {
    return Math.min(window.innerWidth * 0.5, MAX_RIGHT_WIDTH);
  }
  return Math.min(window.innerWidth * 0.95, window.innerWidth);
};

export const SplitLayoutContext = createContext<SplitLayoutContextType>({
  leftSidebarWidth: 280,
  isLeftSidebarExpanded: true,
  isLeftResizing: false,
  setLeftSidebarWidth: () => {},
  setIsLeftResizing: () => {},
  toggleLeftSidebar: () => {},
  closeLeftSidebar: () => {},
  openLeftSidebar: () => {},

  // Default to 50% width on desktop using the helper function
  rightPanelWidth: getDefaultRightWidth(),
  isRightResizing: false,
  isRightSidebarExpanded: false,
  setIsRightSidebarExpanded: () => {},
  setRightPanelWidth: () => {},
  setIsRightResizing: () => {},
  closeRightSidebar: () => {},

  resetRightPanelToDefault: () => {},

  registerChatIdListener: () => {},
});

export const SplitLayoutProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useAccount();
  const [isLeftSidebarExpanded, setIsLeftSidebarExpanded] = useState(false);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(false);

  // Initialize with different widths based on screen size
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  // Initialize right panel width using the helper function
  const [rightPanelWidth, setRightPanelWidth] = useState(
    getDefaultRightWidth()
  );
  const [isRightResizing, setIsRightResizing] = useState(false);

  // Track the current chat ID
  const currentChatIdRef = useRef<string | null>(null);

  // Initialize sidebar widths based on screen size
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set initial widths based on screen size
      const newLeftWidth =
        window.innerWidth < 768
          ? Math.min(280, window.innerWidth * 0.8)
          : Math.min(320, window.innerWidth * 0.25);

      setLeftSidebarWidth(newLeftWidth);
      setRightPanelWidth(getDefaultRightWidth());

      // Handle window resize
      const handleResize = () => {
        setLeftSidebarWidth(
          window.innerWidth < 768
            ? Math.min(280, window.innerWidth * 0.8)
            : Math.min(320, window.innerWidth * 0.25)
        );
        setRightPanelWidth(getDefaultRightWidth());
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  if (!isConnected && isLeftSidebarExpanded) {
    setIsLeftSidebarExpanded(false);
  }

  // When right sidebar is closed, reset to default width
  const resetPanelWidth = useCallback(() => {
    if (!isRightSidebarExpanded) {
      setRightPanelWidth(getDefaultRightWidth());
    }
  }, [isRightSidebarExpanded, setRightPanelWidth]);

  // Reset panel width when sidebar is closed
  useEffect(() => {
    if (!isRightSidebarExpanded) {
      const timer = setTimeout(resetPanelWidth, 10);
      return () => clearTimeout(timer);
    }
  }, [isRightSidebarExpanded, resetPanelWidth]);

  // Simplified reset function - reuses the resetPanelWidth function
  const resetRightPanelToDefault = useCallback(() => {
    setTimeout(resetPanelWidth, 10);
  }, [resetPanelWidth]);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarExpanded(false);
    resetRightPanelToDefault();

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rightSidebarClosed"));
    }
  }, [setIsRightSidebarExpanded, resetRightPanelToDefault]);

  // Simple function to safely set sidebar state - prevents expansion on root page
  const setRightSidebarExpandedSafe = useCallback((isExpanded: boolean) => {
    // Don't expand on root page
    if (
      isExpanded &&
      typeof window !== "undefined" &&
      window.location.pathname === "/"
    ) {
      return;
    }
    setIsRightSidebarExpanded(isExpanded);
  }, []);

  // Track the last time we closed the right sidebar to prevent rapid reopening
  const lastSidebarCloseRef = useRef<number>(0);

  const registerChatIdListener = useCallback(
    (chatId: string) => {
      // Skip if the chat ID is the same (prevents recursive issues)
      if (chatId === currentChatIdRef.current) {
        return;
      }

      if (currentChatIdRef.current) {
        // Ensure we don't close/reset too frequently to prevent loops
        const now = Date.now();
        const timeSinceLastClose = now - lastSidebarCloseRef.current;

        // Only close if we haven't closed in the last 300ms
        if (timeSinceLastClose > 300) {
          // Close the right sidebar completely when changing chats
          closeRightSidebar();
          resetRightPanelToDefault();
          lastSidebarCloseRef.current = now;
        }
      }

      currentChatIdRef.current = chatId;
    },
    [closeRightSidebar, resetRightPanelToDefault]
  );

  return (
    <SplitLayoutContext.Provider
      value={{
        leftSidebarWidth,
        isLeftSidebarExpanded,
        isLeftResizing,
        setLeftSidebarWidth: width =>
          setLeftSidebarWidth(
            Math.max(MIN_LEFT_WIDTH, Math.min(width, MAX_LEFT_WIDTH))
          ),
        setIsLeftResizing,
        toggleLeftSidebar: () => setIsLeftSidebarExpanded(prev => !prev),
        closeLeftSidebar: () => setIsLeftSidebarExpanded(false),
        openLeftSidebar: () => setIsLeftSidebarExpanded(true),

        rightPanelWidth,
        isRightResizing,
        isRightSidebarExpanded,
        setIsRightSidebarExpanded: setRightSidebarExpandedSafe, // Use the safe version!
        setRightPanelWidth: width =>
          setRightPanelWidth(
            Math.max(MIN_RIGHT_WIDTH, Math.min(width, MAX_RIGHT_WIDTH))
          ),
        setIsRightResizing,
        closeRightSidebar,

        // Function to reset to default width
        resetRightPanelToDefault,

        // Chat ID tracking
        registerChatIdListener,
      }}
    >
      {children}
    </SplitLayoutContext.Provider>
  );
};

export const useSplitLayout = () => {
  const context = useContext(SplitLayoutContext);
  if (!context) {
    throw new Error("useSplitLayout must be used within a SplitLayoutProvider");
  }
  return context;
};
