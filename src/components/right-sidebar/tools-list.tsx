import React from "react";

import { LightbulbIcon, Wrench } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

import { useChat } from "@/contexts/chat-context";

import { SIDEBAR_HIDDEN_TOOLS } from "@/constants/tools";

import { SidebarToolView } from "../shared/sidebar-tool-view";

export function ToolsList() {
  // Use the unified tools array
  const { tools } = useChat();

  // Filter out tools that should be hidden from sidebar
  const filteredTools = tools
    .filter(tool => !SIDEBAR_HIDDEN_TOOLS.includes(tool.toolName as string))
    .sort((a, b) => {
      // Sort by timestamp if available (most recent first)
      const aTime = (a as any).timestamp ? (a as any).timestamp.getTime() : 0;
      const bTime = (b as any).timestamp ? (b as any).timestamp.getTime() : 0;
      return bTime - aTime;
    });

  if (filteredTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-full bg-teal-50 dark:bg-teal-900/20 p-3 mb-4">
          <Wrench className="h-10 w-10 text-teal-500 dark:text-teal-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          No tools activated yet.
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-xs mb-4">
          Prompt Matrix to start. Tools will appear here when activated. Be
          safe.
        </p>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-w-xs">
          <div className="flex items-start mb-2">
            <LightbulbIcon className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300 text-left">
              Try asking: &quot;Let&apos;s open a Long Position on $PEPE on
              Hyperliquid.&quot;
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3 flex flex-col gap-2">
        {filteredTools.map(tool => (
          <SidebarToolView
            key={tool.toolCallId}
            toolInvocation={tool}
            messageMode={
              (tool as any).mode || (tool as any).message?.mode || "morpheus"
            }
          />
        ))}
      </div>
    </ScrollArea>
  );
}
