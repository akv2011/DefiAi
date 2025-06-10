import React, { useCallback, useEffect, useRef } from "react";

import {
  LiFiWidget,
  Route,
  RouteExecutionUpdate,
  WidgetEvent,
  useWidgetEvents,
} from "@lifi/widget";
import { CheckCircle, ExternalLink, XCircle } from "lucide-react";
import { Address, formatUnits, zeroAddress } from "viem";
import { arbitrum } from "viem/chains";
import { base } from "viem/chains";
import { useChainId } from "wagmi";

import { Chain, chainIdToName, chainNameToChain } from "@/lib/chains";
import { isToolAborted } from "@/lib/utils";

import { useChat } from "@/contexts/chat-context";

// New component to display bridge completion details
export const BridgeCompletedCard = ({ result }: { result: any }) => {
  let parsedResult;
  try {
    const isAborted =
      isToolAborted(result) ||
      result?.content?.[0]?.text === "Operation aborted by user";
    if (isAborted) {
      return (
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Operation Cancelled
            </h3>
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700">
              <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This swap/bridge operation was cancelled. You can start a new
            operation whenever you&apos;re ready.
          </p>
        </div>
      );
    }
    // The result is expected to be a JSON string within the 'text' field
    // if it comes from certain tool structures (like MCP). Handle potential variations.
    if (typeof result === "string") {
      parsedResult = JSON.parse(result);
    } else if (
      result?.content?.[0]?.text &&
      typeof result.content[0].text === "string"
    ) {
      parsedResult = JSON.parse(result.content[0].text);
    } else if (typeof result === "object" && result !== null) {
      // Assume the result object itself contains the data if not a string or standard structure
      parsedResult = result;
    } else {
      console.error("Unexpected result format for swap_or_bridge:", result);
      parsedResult = {}; // Fallback to avoid errors
    }

    // Extract data safely
    const {
      destinationTxLink,
      toAmount,
      toToken,
      toChain,
      toAmountUSD,
      message, // Use the message from the result if available
    } = parsedResult || {};
    const displayAmount = toAmount
      ? parseFloat(toAmount).toLocaleString(undefined, {
          maximumFractionDigits: 5,
        })
      : "N/A";
    const displayAmountUSD = toAmountUSD
      ? parseFloat(toAmountUSD).toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        })
      : "N/A";
    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{message}</h3>
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Your transaction has been successfully processed.
        </p>
        <div className="text-sm space-y-1">
          <p>
            <strong>Amount:</strong> {displayAmount} {toToken || "N/A"}
          </p>
          <p>
            <strong>Value (USD):</strong> {displayAmountUSD}
          </p>
          <p>
            <strong>Destination Chain:</strong>{" "}
            {chainIdToName[toChain] || "N/A"}
          </p>
        </div>
        {destinationTxLink && (
          <a
            href={destinationTxLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Destination Transaction
          </a>
        )}
      </div>
    );
  } catch (error) {
    console.error(
      "Error parsing bridge result JSON:",
      error,
      "Raw result:",
      result
    );
    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card text-destructive">
        <p>Error displaying bridge result. Could not parse data.</p>
      </div>
    );
  }
};
export const SwapBridgeWidget = ({
  toolCallId,
  fromToken,
  toToken,
  fromChain,
  toChain,
  amount,
}: {
  toolCallId: string;
  fromToken?: Address;
  toToken?: Address;
  fromChain?: Chain;
  toChain?: Chain;
  amount?: string;
}) => {
  const chainId = useChainId();
  const widgetEvents = useWidgetEvents();
  const hasSentResult = useRef(false);
  const { addToolResult } = useChat();
  const handleToolResult = useCallback(
    (resultData: any) => {
      const resultText = JSON.stringify(resultData);
      addToolResult({
        toolCallId,
        result: resultText,
      });
      hasSentResult.current = true;
    },
    [addToolResult, toolCallId]
  );
  const onRouteExecutionCompleted = useCallback(
    (route: Route) => {
      console.log("🚀 ~ onRouteExecutionCompleted ~ route:", route);
      const lastStep = route.steps[route.steps.length - 1];
      const receivingProcess = (lastStep as any).execution?.process.find(
        (p: any) => p.type === "RECEIVING_CHAIN" || p.type === "SWAP"
      );
      const destinationTxLink = receivingProcess?.txLink;
      const toAmount = formatUnits(
        BigInt(route.toAmount),
        route.toToken.decimals
      );
      handleToolResult({
        message: toChain === fromChain ? "Swap Completed" : "Bridge Completed",
        destinationTxLink,
        toAmount,
        toToken: route.toToken.symbol,
        toChain: route.toChainId,
        toAmountUSD: route.toAmountUSD,
      });
    },
    [handleToolResult, toChain, fromChain]
  );
  const onRouteExecutionFailed = useCallback(
    (update: RouteExecutionUpdate) => {
      console.log("🚀 ~ onRouteExecutionFailed ~ update:", update);
      handleToolResult({
        message: "Swap/bridge process failed",
        update,
      });
    },
    [handleToolResult]
  );
  useEffect(() => {
    widgetEvents.on(
      WidgetEvent.RouteExecutionCompleted,
      onRouteExecutionCompleted
    );
    widgetEvents.on(WidgetEvent.RouteExecutionFailed, onRouteExecutionFailed);
    // Cleanup function
    return () => {
      widgetEvents.off(
        WidgetEvent.RouteExecutionCompleted,
        onRouteExecutionCompleted
      );
      widgetEvents.off(
        WidgetEvent.RouteExecutionFailed,
        onRouteExecutionFailed
      );
    };
  }, [widgetEvents, onRouteExecutionCompleted, onRouteExecutionFailed]);
  return (
    <LiFiWidget
      integrator="matrix"
      config={{
        integrator: "matrix",
        theme: {
          container: {
            border: "1px solid rgb(234, 234, 234)",
            borderRadius: "16px",
          },
        },
        fromToken: fromToken ?? zeroAddress,
        toToken: toToken ?? zeroAddress,
        fromChain: fromChain ? chainNameToChain[fromChain].id : chainId,
        toChain: toChain
          ? chainNameToChain[toChain].id
          : chainId === base.id
            ? arbitrum.id
            : base.id,
        fromAmount: amount ?? "0",
      }}
    />
  );
};
