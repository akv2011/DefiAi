import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type TabType = "tools" | "news" | "agents" | "humanoids";
type TabContextType = [TabType, (tab: TabType) => void];

export const TabContext = createContext<TabContextType>([
  "",
  () => {},
] as unknown as TabContextType);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>("" as TabType);

  // Listen for the custom event that's dispatched when the right sidebar is closed
  useEffect(() => {
    const handleRightSidebarClosed = () => {
      // Reset active tab when sidebar is closed
      setActiveTab("" as TabType);
    };

    // Add event listener for sidebar closed event
    window.addEventListener("rightSidebarClosed", handleRightSidebarClosed);

    // Cleanup
    return () => {
      window.removeEventListener(
        "rightSidebarClosed",
        handleRightSidebarClosed
      );
    };
  }, []);

  return (
    <TabContext.Provider value={[activeTab, setActiveTab]}>
      {children}
    </TabContext.Provider>
  );
}

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTab must be used within a TabProvider");
  }
  return context;
};
