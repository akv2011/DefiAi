import React from "react";

import { LineChart, Users, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

import { TabType, useTab } from "@/contexts/tab-context";

interface RightPanelToggleButtonsProps {
  onOpenTab: (tab: TabType) => void;
  orientation?: "vertical" | "horizontal";
}

export function RightPanelToggleButtons({
  onOpenTab,
  orientation = "vertical",
}: RightPanelToggleButtonsProps) {
  const [activeTab] = useTab();
  const isHorizontal = orientation === "horizontal";

  const renderButton = (tab: TabType, icon: React.ReactNode, label: string) => {
    const isActive = activeTab === tab;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "p-0 cursor-pointer relative transition-all touch-manipulation z-10",
              isHorizontal
                ? "w-10 h-10 sm:w-11 sm:h-11 rounded-full mx-1 hover:!bg-transparent"
                : "w-8 h-8 rounded-full",
              isActive
                ? isHorizontal
                  ? "text-emerald-600 dark:text-primary"
                  : "bg-gray-100 dark:bg-gray-800 text-emerald-500 dark:text-primary"
                : isHorizontal
                  ? "text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              isHorizontal && "hover:scale-105 active:scale-95"
            )}
            onClick={() => onOpenTab(tab)}
            aria-label={label}
          >
            {icon}
            {isActive && !isHorizontal && (
              <div className="absolute inset-0 bg-emerald-500/10 dark:bg-primary/10 rounded-full" />
            )}
            {isActive && isHorizontal && (
              <>
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 dark:bg-primary rounded-full" />
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side={isHorizontal ? "top" : "left"}
          className="hidden sm:block py-1 px-2 text-xs"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className={cn(
        isHorizontal
          ? "flex flex-row items-center space-x-0 space-y-0"
          : "flex flex-col items-center space-y-2.5"
      )}
    >
      <TooltipProvider delayDuration={700}>
        {renderButton("tools", <Wrench className="h-4 w-4" />, "Tools")}
        {renderButton("agents", <Users className="h-4 w-4" />, "Agents")}
        {renderButton("news", <LineChart className="h-4 w-4" />, "News")}
      </TooltipProvider>
    </div>
  );
}
