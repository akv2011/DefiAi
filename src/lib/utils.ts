import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type {
  TrackdeskConversionParams,
  TrackdeskParamSource,
} from "../types/trackdesk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the current mode from localStorage with a fallback
 */
export function getCurrentModeFromStorage(defaultMode = "sentinel") {
  let mode = defaultMode;
  if (typeof window !== "undefined") {
    try {
      const storedMode = localStorage.getItem("messageMode");
      if (storedMode === "morpheus" || storedMode === "sentinel") {
        mode = storedMode;
      }
    } catch (e) {
      console.error("Error accessing localStorage for mode:", e);
    }
  }
  return mode;
}

/**
 * Get Tailwind classes for different UI elements based on mode
 */
export function getModeStyling(mode: string) {
  // Handle sentinel mode (purple) vs morpheus mode (green)
  const isSentinel = mode === "sentinel";

  return {
    background: isSentinel
      ? "bg-indigo-100 dark:bg-indigo-900/20"
      : "bg-emerald-100 dark:bg-emerald-900/20",
    text: isSentinel
      ? "text-indigo-600 dark:text-indigo-400"
      : "text-emerald-600 dark:text-emerald-400",
    border: isSentinel
      ? "border-indigo-200 dark:border-indigo-800"
      : "border-emerald-200 dark:border-emerald-800",
    hover: isSentinel
      ? "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30"
      : "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30",
    cardBg: isSentinel
      ? "bg-indigo-50/5 dark:bg-indigo-500/10"
      : "bg-emerald-50/5 dark:bg-emerald-500/10",
    ring: isSentinel ? "ring-indigo-500" : "ring-emerald-500",
    highlight: isSentinel
      ? "text-indigo-900 dark:text-indigo-50"
      : "text-emerald-900 dark:text-emerald-50",
    subtle: isSentinel
      ? "text-indigo-700 dark:text-indigo-300"
      : "text-emerald-700 dark:text-emerald-300",
    muted: isSentinel
      ? "text-indigo-500 dark:text-indigo-400"
      : "text-emerald-500 dark:text-emerald-400",
  };
}

export const formatLargeNumber = (value: number | string): string => {
  const num = Number(value);

  if (num >= 1_000_000) {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    } else {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
  } else {
    return num.toLocaleString();
  }
};

/**
 *
 *
 * @param value
 * @param decimals
 * @param options
 * @returns
 */
/**
 * Check if a tool invocation was aborted by the user
 * @param toolInvocation The tool invocation object to check
 * @returns Boolean indicating if the tool was aborted
 */
export const isToolAborted = (toolInvocation: any): boolean => {
  if (!("result" in toolInvocation)) return false;

  return (
    toolInvocation.result &&
    typeof toolInvocation.result === "object" &&
    "error" in toolInvocation.result &&
    (toolInvocation.result.error === "Operation aborted by user" ||
      toolInvocation.result.error === "All operations aborted by user")
  );
};

/**
 * Check if a tool invocation has a valid completed result
 * @param toolInvocation The tool invocation object to check
 * @returns Boolean indicating if the tool has a valid result (completed successfully)
 */
export const hasToolCompletedSuccessfully = (toolInvocation: any): boolean => {
  if (!("result" in toolInvocation)) return false;

  return (
    toolInvocation.result &&
    typeof toolInvocation.result === "object" &&
    !("error" in toolInvocation.result)
  );
};

export const formatNumber = (
  value: string | number | undefined | null,
  decimals: number = 2, // Default decimals
  options?: Intl.NumberFormatOptions
): string => {
  if (value === undefined || value === null) return "N/A";

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return typeof value === "string" ? value : "N/A";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...options,
    }).format(num);
  } catch (error) {
    console.error("Error formatting number:", error, { value, decimals });
    return num.toFixed(decimals);
  }
};

/**
 * Track a click event using Trackdesk
 * This is used to track user interaction clicks on specific elements
 * @param eventLabel Optional label to identify which element was clicked
 * @param customParams Optional additional parameters to track with the click
 */
export const trackClick = (
  eventLabel?: string,
  customParams?: Record<string, string | number | boolean>
) => {
  if (typeof window === "undefined") {
    return; // Server-side rendering, exit early
  }

  try {
    if (typeof window.trackdesk === "function") {
      // Basic click tracking
      if (!eventLabel && !customParams) {
        window.trackdesk("matrix", "click");
        console.log("Trackdesk click event sent");
        return;
      }

      // Create trackdesk parameters for enhanced click tracking
      const trackingParams: Record<string, any> = {
        ...(customParams || {}),
      };

      // Add event label if provided
      if (eventLabel) {
        trackingParams.eventLabel = eventLabel;
        // Also add to customParams.advS1 for compatibility with Trackdesk
        if (!trackingParams.customParams) {
          trackingParams.customParams = {};
        }
        trackingParams.customParams.advS1 = eventLabel;
      }

      window.trackdesk("matrix", "click", trackingParams);
      console.log(
        `Trackdesk click event sent: ${eventLabel || "unnamed"}`,
        customParams
      );
    } else {
      console.warn(
        `Trackdesk function not available - click tracking skipped: ${eventLabel || "unnamed"}`
      );
    }
  } catch (error) {
    console.error(
      `Error tracking click with Trackdesk (${eventLabel || "unnamed"}):`,
      error
    );
  }
};

/**
 * Track a conversion using Trackdesk
 * @param value The conversion value
 * @param options Additional optional parameters for the conversion
 */
export const trackConversion = (
  value: number | string | TrackdeskParamSource,
  options?: {
    externalId?: string | TrackdeskParamSource;
    customerId?: string | TrackdeskParamSource;
    currencyCode?: string | TrackdeskParamSource;
    status?:
      | "CONVERSION_STATUS_APPROVED"
      | "CONVERSION_STATUS_PENDING"
      | "CONVERSION_STATUS_TEST";
    customParams?: {
      advS1?: string | TrackdeskParamSource;
      advS2?: string | TrackdeskParamSource;
      advS3?: string | TrackdeskParamSource;
      advS4?: string | TrackdeskParamSource;
      advS5?: string | TrackdeskParamSource;
    };
  }
) => {
  if (typeof window === "undefined") {
    return; // Server-side rendering, exit early
  }

  try {
    if (typeof window.trackdesk === "function") {
      const conversionData: TrackdeskConversionParams = {
        conversionType: "lead",
        amount: {
          value: value,
        },
      };

      // Add optional parameters if provided
      if (options?.externalId) conversionData.externalId = options.externalId;
      if (options?.customerId) conversionData.customerId = options.customerId;
      if (options?.currencyCode)
        conversionData.currencyCode = options.currencyCode;
      if (options?.status) conversionData.status = options.status;
      if (options?.customParams)
        conversionData.customParams = options.customParams;

      window.trackdesk("matrix", "conversion", conversionData);
      console.log("Trackdesk conversion event sent:", { value, ...options });
    } else {
      console.warn(
        "Trackdesk function not available - conversion tracking skipped"
      );
    }
  } catch (error) {
    console.error("Error tracking conversion with Trackdesk:", error);
  }
};
