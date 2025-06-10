import React, { useEffect, useState } from "react";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "framer-motion";
import { LineChart, Users, Wrench, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useChat } from "@/contexts/chat-context";
import { TabType } from "@/contexts/tab-context";

import { SIDEBAR_HIDDEN_TOOLS } from "@/constants/tools";

import LiveMarketData from "./CryptoMarket";
import { ToolsList } from "./tools-list";

// Tab label animation variants
const tabLabelVariants = {
  hidden: {
    opacity: 0,
    width: 0,
    x: 8,
    marginLeft: 0,
  },
  visible: {
    opacity: 1,
    width: "auto",
    x: 0,
    marginLeft: 8,
    transition: {
      duration: 0.35,
      width: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
      opacity: {
        duration: 0.25,
      },
    },
  },
  exit: {
    opacity: 0,
    width: 0,
    x: 8,
    marginLeft: 0,
    transition: {
      duration: 0.2,
      opacity: { duration: 0.1 },
    },
  },
};

// Desktop tab label variants - no animation, always visible
const desktopTabLabelVariants = {
  visible: {
    opacity: 1,
    width: "auto",
    x: 0,
    marginLeft: 8,
  },
};

interface RightPanelTabsProps {
  activeTab: string;
  setActiveTab: (tab: TabType) => void;
  onClose: () => void;
}

export function RightPanelTabs({
  activeTab,
  setActiveTab,
  onClose,
}: RightPanelTabsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { tools } = useChat();

  // Get tools count from the unified tools array
  const toolsCount = tools.filter(
    tool => !SIDEBAR_HIDDEN_TOOLS.includes(tool.toolName as string)
  ).length;

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
  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={(tab: string) => setActiveTab(tab as TabType)}
      className="h-full flex flex-col shadow-lg overflow-hidden"
    >
      <div className="flex justify-between items-center px-2 sm:px-4 py-[7px] border-b border-gray-200/60 dark:border-gray-800/40">
        <TabsPrimitive.List className="flex space-x-0 sm:space-x-2">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsPrimitive.Trigger
                  value="tools"
                  className="relative flex items-center h-10 rounded-md transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:text-teal-500 dark:data-[state=active]:text-teal-400 overflow-hidden cursor-pointer group"
                  style={{
                    minWidth: isMobile ? "32px" : "80px",
                    width: "auto",
                    paddingLeft: "6px",
                    paddingRight: "8px",
                  }}
                >
                  <Wrench className="h-5 w-5 flex-shrink-0 transition-transform group-data-[state=active]:scale-110 duration-300" />
                  {isMobile ? (
                    <AnimatePresence initial={false}>
                      {activeTab === "tools" && (
                        <motion.span
                          className="font-medium text-sm whitespace-nowrap"
                          variants={tabLabelVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          Tools {toolsCount > 0 && `(${toolsCount})`}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  ) : (
                    <motion.span
                      className="font-medium text-sm whitespace-nowrap hidden md:block"
                      variants={desktopTabLabelVariants}
                      animate="visible"
                    >
                      Tools {toolsCount > 0 && `(${toolsCount})`}
                    </motion.span>
                  )}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 dark:bg-teal-400 rounded-t-sm"
                    initial={{
                      scaleX: 0,
                      opacity: 0,
                    }}
                    animate={{
                      scaleX: activeTab === "tools" ? 1 : 0,
                      opacity: activeTab === "tools" ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  />
                </TabsPrimitive.Trigger>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className={activeTab === "tools" || !isMobile ? "hidden" : ""}
              >
                <p className="text-xs text-black">
                  Tools {toolsCount > 0 && `(${toolsCount})`}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsPrimitive.Trigger
                  value="agents"
                  className="relative flex items-center h-10 rounded-md transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:text-teal-500 dark:data-[state=active]:text-teal-400 overflow-hidden cursor-pointer group"
                  style={{
                    minWidth: isMobile ? "32px" : "80px",
                    width: "auto",
                    paddingLeft: "6px",
                    paddingRight: "8px",
                  }}
                >
                  <Users className="h-5 w-5 flex-shrink-0 transition-transform group-data-[state=active]:scale-110 duration-300" />
                  {isMobile ? (
                    <AnimatePresence initial={false}>
                      {activeTab === "agents" && (
                        <motion.span
                          className="font-medium text-sm whitespace-nowrap"
                          variants={tabLabelVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          Agents
                        </motion.span>
                      )}
                    </AnimatePresence>
                  ) : (
                    <motion.span
                      className="font-medium text-sm whitespace-nowrap hidden md:block"
                      variants={desktopTabLabelVariants}
                      animate="visible"
                    >
                      Agents
                    </motion.span>
                  )}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 dark:bg-teal-400 rounded-t-sm"
                    initial={{
                      scaleX: 0,
                      opacity: 0,
                    }}
                    animate={{
                      scaleX: activeTab === "agents" ? 1 : 0,
                      opacity: activeTab === "agents" ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  />
                </TabsPrimitive.Trigger>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className={activeTab === "agents" || !isMobile ? "hidden" : ""}
              >
                <p className="text-xs text-black">Agents</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsPrimitive.Trigger
                  value="news"
                  className="relative flex items-center h-10 rounded-md transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:text-teal-500 dark:data-[state=active]:text-teal-400 overflow-hidden cursor-pointer group"
                  style={{
                    minWidth: isMobile ? "32px" : "80px",
                    width: "auto",
                    paddingLeft: "6px",
                    paddingRight: "8px",
                  }}
                >
                  <LineChart className="h-5 w-5 flex-shrink-0 transition-transform group-data-[state=active]:scale-110 duration-300" />
                  {isMobile ? (
                    <AnimatePresence initial={false}>
                      {activeTab === "news" && (
                        <motion.span
                          className="font-medium text-sm whitespace-nowrap"
                          variants={tabLabelVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          News
                        </motion.span>
                      )}
                    </AnimatePresence>
                  ) : (
                    <motion.span
                      className="font-medium text-sm whitespace-nowrap hidden md:block"
                      variants={desktopTabLabelVariants}
                      animate="visible"
                    >
                      News
                    </motion.span>
                  )}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 dark:bg-teal-400 rounded-t-sm"
                    initial={{
                      scaleX: 0,
                      opacity: 0,
                    }}
                    animate={{
                      scaleX: activeTab === "news" ? 1 : 0,
                      opacity: activeTab === "news" ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  />
                </TabsPrimitive.Trigger>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className={activeTab === "news" || !isMobile ? "hidden" : ""}
              >
                <p className="text-xs text-black">News</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsPrimitive.List>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <TabsPrimitive.Content
        value="tools"
        className="flex-1 h-full overflow-auto overflow-x-hidden tools-tab-active"
      >
        <ToolsList />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content
        value="news"
        className="flex-1 h-full overflow-auto overflow-x-hidden"
      >
        <LiveMarketData />
      </TabsPrimitive.Content>

      <TabsPrimitive.Content
        value="agents"
        className="flex-1 h-full overflow-auto overflow-x-hidden"
      >
        <div className="p-6 flex flex-col items-center justify-center h-full text-center">
          <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
            <Users className="h-12 w-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Agents Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-2">
            We&apos;re working on bringing intelligent agents to help automate
            your workflows.
          </p>
        </div>
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}
