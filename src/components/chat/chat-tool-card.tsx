import React from "react";

import { ToolInvocation as ToolInvocationType } from "ai";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, XCircle } from "lucide-react";

import { ToolHeaderInfo } from "@/components/shared/tool-header-info";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { isToolAborted } from "@/lib/utils";

import { useChat } from "@/contexts/chat-context";
import { useSplitLayout } from "@/contexts/split-layout-context";
import { useTab } from "@/contexts/tab-context";

import { SIDEBAR_HIDDEN_TOOLS, TOOL_INFO } from "@/constants/tools";

import { AmountInput } from "./tools/amount-input";
import { ChainSelector } from "./tools/chain-selector";

export const ChatToolCard = ({
  toolInvocation,
  isHighlighted,
  messageMode,
}: {
  toolInvocation: ToolInvocationType;
  isHighlighted?: boolean;
  messageMode?: string;
}) => {
  const {
    addToolResult,
    activeMode,
    setSelectedToolId,
    selectedToolId,
    abortSingleTool,
  } = useChat();
  const { setIsRightSidebarExpanded } = useSplitLayout();
  const [, setActiveTab] = useTab();
  const toolCallId = toolInvocation.toolCallId;
  const hasResult = "result" in toolInvocation;
  const isAborted = isToolAborted(toolInvocation);

  if (
    isAborted &&
    ["getAmount", "getDesiredChain"].includes(toolInvocation.toolName)
  ) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50/60 dark:bg-red-900/20 rounded-lg border border-red-200/60 dark:border-red-700/40 shadow-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-800/60 flex items-center justify-center"
        >
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
        </motion.div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            {toolInvocation.toolName === "getAmount"
              ? "Amount selection"
              : "Chain selection"}{" "}
            was cancelled
          </span>
          <span className="text-xs text-red-600 dark:text-red-300 mt-0.5">
            Please try again with a new request
          </span>
        </div>
      </div>
    );
  }

  // Render input tools directly in the chat
  if (toolInvocation.toolName === "getAmount") {
    return (
      <AmountInput
        onSubmit={amount =>
          addToolResult({
            toolCallId,
            result: amount,
          })
        }
        disabled={hasResult}
        result={hasResult && !isAborted ? toolInvocation.result : undefined}
        maxAmount={toolInvocation.args?.maxAmount}
        tokenSymbol={toolInvocation.args?.tokenSymbol}
      />
    );
  }

  if (toolInvocation.toolName === "getDesiredChain") {
    return (
      <ChainSelector
        selectedChain={
          hasResult && !isAborted ? toolInvocation.result.chain : null
        }
        onSelect={chain =>
          addToolResult({
            toolCallId,
            result: { chain },
          })
        }
        disabled={hasResult}
      />
    );
  }

  // Get tool info for title and description
  const toolInfo = TOOL_INFO[
    toolInvocation.toolName as keyof typeof TOOL_INFO
  ] || {
    label: toolInvocation.toolName,
    description: "Tool execution",
  };

  // Function to open the tool in the sidebar and scroll to it
  const viewInSidebar = () => {
    // Also don't open sidebar for tools in the SIDEBAR_HIDDEN_TOOLS list
    if (SIDEBAR_HIDDEN_TOOLS.includes(toolInvocation.toolName as any)) {
      return;
    }

    setIsRightSidebarExpanded(true);
    setSelectedToolId(toolCallId);
    setActiveTab("tools");
  };

  // Use message-specific mode if available, otherwise use active global mode
  const mode = messageMode || activeMode;

  // Get the appropriate icon based on tool type
  const IconComponent = toolInfo.icon || ArrowRight;

  // Check if this tool is currently selected in the sidebar
  const isSelected = selectedToolId === toolCallId;

  const isHiddenFromSidebar = SIDEBAR_HIDDEN_TOOLS.includes(
    toolInvocation.toolName as (typeof SIDEBAR_HIDDEN_TOOLS)[number]
  );

  const showRightArrow = !isHiddenFromSidebar;

  return (
    <Card
      className={`
        py-2 px-3 mb-2 relative group
        backdrop-blur-sm backdrop-filter
        hover:shadow-md transition-all duration-200
        ${
          isHighlighted || isSelected
            ? `ring-2 ${mode === "sentinel" ? "ring-indigo-500" : "ring-emerald-500"} shadow-md`
            : ""
        }
        ${
          mode === "sentinel"
            ? `border-indigo-300/25 hover:border-indigo-300/40 dark:border-indigo-500/25 dark:hover:border-indigo-500/40 
               ${isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""}`
            : `border-emerald-300/25 hover:border-emerald-300/40 dark:border-emerald-500/25 dark:hover:border-emerald-500/40
               ${isSelected ? "bg-emerald-50/50 dark:bg-emerald-950/30" : ""}`
        }
      `}
      onClick={isHiddenFromSidebar ? undefined : viewInSidebar}
      style={{
        cursor: isHiddenFromSidebar ? "default" : "pointer",
      }}
    >
      {/* Subtle solid overlay */}
      <div className="absolute inset-0 rounded-lg bg-white/10 dark:bg-black/10 opacity-50"></div>

      <div className="flex items-center relative z-10">
        <div
          className={`
          flex-shrink-0 mr-3 p-1.5 rounded-md relative
          ${
            mode === "sentinel"
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          }
        `}
        >
          <IconComponent size={16} />

          {/* Status indicator dot */}
          <div className="absolute -top-1 -right-1">
            <div
              className={`w-2.5 h-2.5 rounded-full border border-white dark:border-gray-800 ${
                hasResult
                  ? mode === "sentinel"
                    ? "bg-indigo-500"
                    : "bg-emerald-500"
                  : "bg-gray-300 dark:bg-gray-600 animate-pulse"
              }`}
            ></div>
          </div>
        </div>

        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-grow flex items-center">
          {toolInfo.label}
          <ToolHeaderInfo
            args={toolInvocation.args}
            toolName={toolInvocation.toolName}
          />
          {!hasResult && !isAborted && (
            <div className="ml-2 flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500 dark:text-gray-400" />
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={e => {
                  e.stopPropagation();
                  abortSingleTool(toolCallId);
                }}
                title="Abort pending tool"
              >
                <XCircle className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
              </Button>
            </div>
          )}
          {isAborted && (
            <div className="ml-2 flex items-center justify-center">
              <span className="text-xs text-red-500 dark:text-red-400">
                Aborted
              </span>
            </div>
          )}
        </div>

        {showRightArrow && (
          <ArrowRight
            size={14}
            className="text-gray-400 dark:text-gray-500 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        )}
      </div>
    </Card>
  );
};
