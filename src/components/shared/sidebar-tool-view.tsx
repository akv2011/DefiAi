import React, { useEffect, useRef } from "react";

import { Activity, ChevronRight, Loader2, XCircle } from "lucide-react";

import { ToolHeaderInfo } from "@/components/shared/tool-header-info";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { cn, getModeStyling } from "@/lib/utils";

import { MessageMode, useChat } from "@/contexts/chat-context";
import { useSplitLayout } from "@/contexts/split-layout-context";
import { useTab } from "@/contexts/tab-context";

import { SIDEBAR_HIDDEN_TOOLS, TOOL_INFO } from "@/constants/tools";

import { BalancesCard } from "../chat/tools/balances-card";
import { DeBridgeWidget } from "../chat/tools/debridge-widget";
import { HyperliquidOpenOrdersCard } from "../chat/tools/hyperliquid-open-orders-card";
import { HyperliquidOrderInvocation } from "../chat/tools/hyperliquid-order-invocation";
import { HyperliquidPositionsCard } from "../chat/tools/hyperliquid-positions-card";
import {
  BridgeCompletedCard,
  SwapBridgeWidget,
} from "../chat/tools/lifi-widget";
import { MarketDataCard } from "../chat/tools/market-data-card";
import { MultiStepTransactionHandler } from "../chat/tools/multi-step-transaction-handler";
import { PositionsCard } from "../chat/tools/positions-card";
import { TokenDataCard } from "../chat/tools/token-data-card";
import { YieldOpportunitiesCard } from "../chat/tools/yield-opportunities-card";
import EnhancedLoading from "./EnhancedLoading";

const parseToolResult = (text: string) => {
  try {
    if (!text.trim().startsWith("{") || !text.trim().endsWith("}")) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
};

type ToolInvocation = {
  toolName: string;
  toolCallId: string;
  args?: any;
  mode?: string;
  message?: {
    mode?: string;
  };
  state?: string;
  result?: any;
};

export function SidebarToolView({
  toolInvocation,
  messageMode,
}: {
  toolInvocation: ToolInvocation;
  messageMode?: MessageMode;
}) {
  const { selectedToolId, setSelectedToolId, addToolResult, messages } =
    useChat();

  const messageMode_ = (messageMode ||
    toolInvocation.mode ||
    (toolInvocation.message?.mode ?? "morpheus")) as MessageMode;
  const effectiveMode = messageMode_;

  const { setIsRightSidebarExpanded, resetRightPanelToDefault } =
    useSplitLayout();
  const [, setActiveTab] = useTab();

  // Store default sidebar width in a ref to restore it later
  // Store a flag to track if user has manually resized
  const userResizedRef = useRef<boolean>(false);

  // Set this when user manually drags the resize handle
  useEffect(() => {
    const handleMouseDown = () => {
      userResizedRef.current = true;
    };

    // Listen for mousedown on resize handles
    const resizeHandles = document.querySelectorAll(".sidebar-resize-handle");
    resizeHandles.forEach(handle => {
      handle.addEventListener("mousedown", handleMouseDown);
    });

    return () => {
      resizeHandles.forEach(handle => {
        handle.removeEventListener("mousedown", handleMouseDown);
      });
    };
  }, []);

  // Update width when tool selection changes - must be defined before early return
  const isSelected = selectedToolId === toolInvocation.toolCallId;

  // Get the state, ensuring backward compatibility
  const toolState = toolInvocation.state ?? "unknown";

  const resultInMessages = React.useMemo(() => {
    if (!messages || messages.length === 0) return false;

    for (const message of messages) {
      if (!message.parts) continue;

      for (const part of message.parts) {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation &&
          part.toolInvocation.toolCallId === toolInvocation.toolCallId &&
          (part.toolInvocation as any).result
        ) {
          return true;
        }
      }
    }
    return false;
  }, [messages, toolInvocation.toolCallId]);

  // Find the result in messages if available - we must define this before any conditional returns
  const findResultInMessagesMemo = React.useMemo(() => {
    if (!messages || messages.length === 0) return null;

    for (const message of messages) {
      if (!message.parts) continue;

      for (const part of message.parts) {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation &&
          part.toolInvocation.toolCallId === toolInvocation.toolCallId &&
          (part.toolInvocation as any).result
        ) {
          return part.toolInvocation;
        }
      }
    }
    return null;
  }, [messages, toolInvocation.toolCallId]);

  // CRITICAL FIX: For ALL tools, if they have a result property in any location,
  const effectiveState =
    resultInMessages ||
    findResultInMessagesMemo !== null ||
    "result" in toolInvocation
      ? "result"
      : toolState;

  const isLoading =
    !resultInMessages &&
    (effectiveState === "partial-call" || effectiveState === "call") &&
    toolInvocation.toolName !== "swap_or_bridge" &&
    toolInvocation.toolName !== "createPerpsOrder" &&
    toolInvocation.toolName !== "deposit_withdraw_hyperliquid";
  const toolCallId = toolInvocation.toolCallId;

  const toolInfo = TOOL_INFO[
    toolInvocation.toolName as keyof typeof TOOL_INFO
  ] || {
    label: toolInvocation.toolName
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: "Tool execution",
    icon: Activity,
  };

  const IconComponent = toolInfo.icon;

  const handleClick = () => {
    if (isSelected) {
      setSelectedToolId(null);
      resetRightPanelToDefault();
      return;
    }

    setSelectedToolId(toolInvocation.toolCallId);

    setIsRightSidebarExpanded(true);
    setActiveTab("tools");
  };

  // Skip rendering for hidden tools
  if (SIDEBAR_HIDDEN_TOOLS.includes(toolInvocation.toolName as any)) {
    return null;
  }

  // Render the actual tool content
  const renderToolContent = () => {
    const result =
      (findResultInMessagesMemo as any)?.result ||
      ("result" in toolInvocation ? toolInvocation.result : null);
    let finalParsedResult: any = undefined;
    if (result) {
      let potentialResultContainer = result.parsedResult ?? result;

      if (
        Array.isArray(potentialResultContainer?.content) &&
        potentialResultContainer.content.length > 0 &&
        typeof potentialResultContainer.content[0] === "object" &&
        potentialResultContainer.content[0] !== null
      ) {
        potentialResultContainer = potentialResultContainer.content[0];
      }

      if (typeof potentialResultContainer?.text === "string") {
        const parsedText = parseToolResult(potentialResultContainer.text);
        if (parsedText) {
          potentialResultContainer = parsedText;
        }
      }
      finalParsedResult = potentialResultContainer;
    }
    if (finalParsedResult?.transactionData) {
      console.log(
        "[DEBUG sidebar-tool-view] Rendering MultiStepTransactionHandler based on transactionData"
      );
      return (
        <MultiStepTransactionHandler
          parsedResult={finalParsedResult}
          toolCallId={toolCallId}
          messageMode="sentinel"
        />
      );
    }

    // Special handling for SwapBridge Widget - needs to render even without result
    if (toolInvocation.toolName === "swap_or_bridge") {
      if (result) {
        return <BridgeCompletedCard result={result} />;
      } else {
        return (
          <SwapBridgeWidget
            toolCallId={toolCallId}
            fromToken={toolInvocation.args?.fromToken}
            toToken={toolInvocation.args?.toToken}
            fromChain={toolInvocation.args?.fromChain}
            toChain={toolInvocation.args?.toChain}
            amount={toolInvocation.args?.amount}
          />
        );
      }
    }

    // Special handling for Hyperliquid order creation - needs to render even without result
    if (toolInvocation.toolName === "createPerpsOrder") {
      return (
        <HyperliquidOrderInvocation
          onComplete={result =>
            addToolResult?.({
              toolCallId,
              result,
            })
          }
          args={toolInvocation.args}
        />
      );
    }

    if (toolInvocation.toolName === "deposit_withdraw_hyperliquid") {
      return (
        <DeBridgeWidget
          toolCallId={toolCallId}
          action={toolInvocation.args.action}
          otherChain={toolInvocation.args.otherChain}
          amount={toolInvocation.args.amount}
        />
      );
    }

    // Early return if no result for other tools
    if (!finalParsedResult) {
      return null;
    }

    // MCP-provided tools
    if (toolInvocation.toolName === "get_lending_positions") {
      return <PositionsCard data={finalParsedResult} />;
    }

    if (
      toolInvocation.toolName === "get_token_balances" ||
      toolInvocation.toolName === "get_wallet_balance"
    ) {
      return (
        <BalancesCard
          balances={finalParsedResult.balances}
          messageMode={messageMode}
        />
      );
    }

    if (toolInvocation.toolName === "get_token_info") {
      if (finalParsedResult?.token) {
        return (
          <TokenDataCard
            activeMode={effectiveMode}
            chain={toolInvocation.args.chain}
            data={finalParsedResult.token}
          />
        );
      } else {
        return (
          <Card className="mb-4 bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 max-w-full overflow-hidden p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Token not found
              </p>
            </div>
          </Card>
        );
      }
    }

    if (toolInvocation.toolName === "get_lending_markets") {
      return (
        <MarketDataCard markets={finalParsedResult} messageMode={messageMode} />
      );
    }

    if (toolInvocation.toolName === "get_yield_opportunities") {
      return (
        <YieldOpportunitiesCard
          yieldData={finalParsedResult}
          messageMode={messageMode}
        />
      );
    }

    if (toolInvocation.toolName === "get_hyperliquid_positions") {
      return <HyperliquidPositionsCard accountState={finalParsedResult} />;
    }

    if (toolInvocation.toolName === "get_hyperliquid_open_orders") {
      return <HyperliquidOpenOrdersCard orders={finalParsedResult} />;
    }

    // Default case - no specific rendering
    return (
      <div className="text-sm">No specific sidebar view for this tool.</div>
    );
  };

  return (
    <div
      className="pt-1 px-0.5"
      id={`sidebar-tool-${toolInvocation.toolCallId}`}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-150 group shadow-sm hover:shadow",
          isSelected
            ? `ring-1 ${getModeStyling(effectiveMode).ring} ${getModeStyling(effectiveMode).cardBg}`
            : getModeStyling(effectiveMode).hover
        )}
        onClick={handleClick}
      >
        <CardHeader className="p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isLoading
                  ? getModeStyling(effectiveMode).background
                  : getModeStyling(effectiveMode).cardBg,
                isSelected
                  ? getModeStyling(effectiveMode).text
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              {isLoading ? (
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <div className="absolute -top-0.5 -right-0.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        effectiveMode === "sentinel"
                          ? "bg-indigo-500"
                          : "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>
              ) : (
                <IconComponent className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center mr-1 overflow-hidden">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {toolInfo.label}
                  </h3>
                  <ToolHeaderInfo
                    args={toolInvocation.args}
                    toolName={toolInvocation.toolName}
                  />
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-all duration-200 ml-1 flex-shrink-0",
                    isSelected
                      ? "rotate-90"
                      : "opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5"
                  )}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  </div>
                ) : (
                  toolInfo.description
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        {isSelected && (
          <CardContent
            className="px-4 pb-4 pt-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="mt-1">
              {isLoading ? (
                <EnhancedLoading mode={effectiveMode} />
              ) : (
                renderToolContent()
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
