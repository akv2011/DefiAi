import React, { useCallback, useEffect, useRef } from "react";

import { Chain, chainNameToChain } from "@/lib/chains";

// Assuming chain mapping exists
import { useChat } from "@/contexts/chat-context";

// Define the structure for DeBridge widget configuration
// Based on https://docs.debridge.finance/dln-the-debridge-liquidity-network-protocol/debridge-widget#widget-object-settings-description
interface DeBridgeWidgetConfig {
  element: string; // Mandatory: unique id of Html element
  v?: string; // Widget version ('1')
  mode?: string; // Type of project ('deswap')
  title?: string; // Widget header
  width?: string | number; // Width of widget
  height?: string | number; // Height of widget
  inputChain?: number; // ID of input chain
  outputChain?: number; // ID of output chain
  inputCurrency?: string; // Address of input token
  outputCurrency?: string; // Address of output token
  address?: string; // Address of receiver
  amount?: string; // Amount for exchange
  lang?: string; // Language ('en', 'fr', etc.)
  styles?: string; // Base64 encoded styles object
  theme?: "dark" | "light"; // Theme
  r?: string; // Referral address/ID
}

// Define the structure for DeBridge widget instance (simplified)
// Based on https://docs.debridge.finance/dln-the-debridge-liquidity-network-protocol/debridge-widget#debridge-widget-events-and-methods
interface DeBridgeWidgetInstance {
  on: (eventName: string, callback: (widget: any, params: any) => void) => void;
  // Add other methods if needed, like disconnect, changeInputChain etc.
}

// Extend window interface to include deBridge object
declare global {
  interface Window {
    deBridge?: {
      widget: (config: DeBridgeWidgetConfig) => Promise<DeBridgeWidgetInstance>;
    };
  }
}

const HYPERLIQUID_CHAIN_ID = 998;
const HYPERLIQUID_TOKEN_ADDRESS = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

export const DeBridgeWidget = ({
  toolCallId,
  action,
  otherChain,
  amount,
}: {
  toolCallId: string;
  action: "deposit" | "withdraw";
  otherChain?: Chain;
  amount?: string;
}) => {
  const widgetContainerId = `debridge-widget-${toolCallId}`;
  const hasSentResult = useRef(false);
  const widgetState = useRef({
    instance: null as DeBridgeWidgetInstance | null,
    initialized: false,
  });
  const { addToolResult } = useChat();

  const handleToolResult = useCallback(
    (resultData: any) => {
      if (hasSentResult.current) return;
      addToolResult({
        toolCallId,
        result: JSON.stringify(resultData),
      });
      hasSentResult.current = true;
    },
    [addToolResult, toolCallId]
  );

  const handleWidgetEvent = useCallback(
    (eventType: string, params: any) => {
      console.log(`DeBridge ${eventType} event:`, params);

      if (["Fulfilled", "Sent", "Completed_Success"].includes(params?.status)) {
        handleToolResult({
          message: `DeBridge ${eventType} Completed`,
          status: params.status,
          data: params,
        });
      } else if (["Cancelled", "Failed"].includes(params?.status)) {
        handleToolResult({
          message: `DeBridge ${eventType} Failed`,
          status: params.status,
          error: params,
        });
      }
    },
    [handleToolResult]
  );

  const cleanup = useCallback(() => {
    widgetState.current.initialized = false;
    widgetState.current.instance = null;

    // Remove iframes
    const container = document.getElementById(widgetContainerId);
    if (container) {
      container.querySelectorAll("iframe").forEach(iframe => iframe.remove());
    }
  }, [widgetContainerId]);

  useEffect(() => {
    const scriptId = "debridge-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initializeWidget = async () => {
      // Prevent duplicate initialization
      if (widgetState.current.initialized) return;

      // Clean any existing widgets
      cleanup();

      if (!window.deBridge) {
        console.error("DeBridge script not loaded yet.");
        return;
      }

      const config: DeBridgeWidgetConfig = {
        element: widgetContainerId,
        mode: "deswap",
        theme: "dark",
        width: "100%",
        ...(action === "deposit"
          ? {
              inputChain: otherChain
                ? chainNameToChain[otherChain]?.id
                : undefined,
              outputChain: HYPERLIQUID_CHAIN_ID,
              outputCurrency: HYPERLIQUID_TOKEN_ADDRESS,
            }
          : {
              inputChain: HYPERLIQUID_CHAIN_ID,
              inputCurrency: HYPERLIQUID_TOKEN_ADDRESS,
              outputChain: otherChain
                ? chainNameToChain[otherChain]?.id
                : undefined,
            }),
        amount,
      };

      try {
        widgetState.current.instance = await window.deBridge.widget(config);
        widgetState.current.initialized = true;

        widgetState.current.instance.on("order", (_, params) =>
          handleWidgetEvent("Order", params)
        );
        widgetState.current.instance.on("bridge", (_, params) =>
          handleWidgetEvent("Bridge", params)
        );
        widgetState.current.instance.on("needConnect", () =>
          console.log("DeBridge connection requested")
        );
      } catch (error) {
        console.error("Failed to initialize DeBridge Widget:", error);
        handleToolResult({
          message: "Failed to initialize DeBridge Widget",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://app.debridge.finance/assets/scripts/widget.js";
      script.async = true;
      script.onload = initializeWidget;
      script.onerror = () =>
        handleToolResult({ message: "Failed to load DeBridge widget script" });
      document.body.appendChild(script);
    } else if (window.deBridge) {
      initializeWidget();
    } else {
      script.addEventListener("load", initializeWidget);
    }

    return cleanup;
  }, [
    action,
    amount,
    handleToolResult,
    handleWidgetEvent,
    otherChain,
    widgetContainerId,
    cleanup,
  ]);

  return (
    <div
      id={widgetContainerId}
      style={{
        width: "100%",
        height: "550px",
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative",
        display: "block",
      }}
    ></div>
  );
};
