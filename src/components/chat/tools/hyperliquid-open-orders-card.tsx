import React, { useEffect, useState } from "react";

// Import the hook
import * as hl from "@nktkas/hyperliquid";
// Added Button
import { Loader2, XCircle } from "lucide-react";
// Import hyperliquid types
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
// For displaying side (Buy/Sell)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Added Loader2 and XCircle
import { useHyperliquidClient } from "@/hooks/use-hyperliquid-client";

// Import toast for feedback

// Assuming OrderSide is 'B' for Buy and 'S' for Sell
type OrderSide = "B" | "S";
type HyperliquidOrderType = {
  oid: number;
  asset: string;
  side: OrderSide;
  limitPx: string;
  sz: string;
  timestamp: number;
  origSz: string;
  isTrigger: boolean;
  triggerPx: string; // Added
  triggerCondition: string; // Added
  reduceOnly: boolean;
  orderType: OrderType; // Added (with specific type)
  tif?: TIF | null; // Added (optional)
  cloid?: string | null; // Added (optional)
  isPositionTpsl: boolean; // Added
};
// If needed elsewhere, these types might also need exporting:
type TIF = "Gtc" | "Alo" | "Ioc" | "FrontendMarket" | "LiquidationMarket";
type OrderType =
  | "Limit"
  | "Market"
  | "Stop Limit"
  | "Stop Market"
  | "Take Profit Limit"
  | "Take Profit Market";

interface HyperliquidOpenOrdersCardProps {
  orders: HyperliquidOrderType[];
  onOrderCancelled?: (oid: number) => void; // Optional callback
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const formatPrice = (price: string): string => {
  // Assuming price needs formatting similar to tokens
  // Adjust decimals based on Hyperliquid's precision if known
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice)) return "-"; // Handle cases where price might not be a number
  return `$${parsedPrice.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}`;
};

const formatSize = (size: string, asset: string): string => {
  // Assuming size needs formatting similar to tokens
  // Adjust decimals based on Hyperliquid's precision if known
  return `${parseFloat(size).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })} ${asset}`; // Example formatting
};

// Calculate and format order value
const formatOrderValue = (size: string, price: string): string => {
  const value = parseFloat(size) * parseFloat(price);
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2, // Keep it to 2 decimal places for currency
  })}`;
};

export const HyperliquidOpenOrdersCard: React.FC<
  HyperliquidOpenOrdersCardProps
> = ({ orders, onOrderCancelled }) => {
  const {
    approveAgentIfNeeded,
    getMarketIndex,
    isLoading: isClientLoading,
    error: clientError,
  } = useHyperliquidClient();
  const [cancellingOid, setCancellingOid] = useState<number | null>(null);
  const [displayedOrders, setDisplayedOrders] =
    useState<HyperliquidOrderType[]>(orders); // Add local state for orders

  // Sync local state with props
  useEffect(() => {
    setDisplayedOrders(orders);
  }, [orders]);

  const handleCancelOrder = async (order: HyperliquidOrderType) => {
    if (clientError) {
      toast.error(`Client Error: ${clientError}`);
      return;
    }

    setCancellingOid(order.oid);

    try {
      const agentClient = await approveAgentIfNeeded();
      if (!agentClient) {
        toast.error("Failed to get agent client.");
        setCancellingOid(null);
        return;
      }

      const marketIndex = getMarketIndex(order.asset);
      if (marketIndex === undefined) {
        throw new Error(`Market index not found for asset: ${order.asset}`);
      }

      // Correct structure for CancelRequest payload - Define inline
      const cancelPayload: hl.CancelParameters = {
        cancels: [
          {
            a: marketIndex,
            o: order.oid,
          },
        ],
      };

      console.log("Attempting to cancel order with payload:", cancelPayload);

      // Pass the full payload object to the cancel method
      // Type assertion might be needed if SDK types are not perfectly inferred
      const result: hl.BaseExchangeResponse =
        await agentClient.cancel(cancelPayload);

      console.log("Cancel result:", result);

      // Check for success status and ensure response is an object with type property
      if (
        result.status === "ok" &&
        typeof result.response === "object" &&
        result.response !== null &&
        "type" in result.response
      ) {
        if (result.response.type === "cancel") {
          // Assert the specific structure of data when type is "cancel"
          const responseData = result.response.data as {
            statuses: ("success" | { error: string })[];
          };
          const statuses = responseData.statuses;
          const cancelledOids = statuses
            .map((status: "success" | { error: string }, index: number) =>
              status === "success" ? cancelPayload.cancels[index].o : null
            )
            .filter((oid: number | null): oid is number => oid !== null); // Type guard for filtering nulls

          if (cancelledOids.includes(order.oid)) {
            toast.success(`Order ${order.oid} cancelled successfully.`);
            // Update local state to remove the cancelled order
            setDisplayedOrders(currentOrders =>
              currentOrders.filter(o => o.oid !== order.oid)
            );
            onOrderCancelled?.(order.oid); // Notify parent if callback provided
          } else {
            // Check if there was a specific error status for this order
            const orderIndex = cancelPayload.cancels.findIndex(
              c => c.o === order.oid
            );
            const orderStatus = statuses[orderIndex];
            let specificError = "Unknown reason";
            // Check if orderStatus is the error object
            if (
              typeof orderStatus === "object" &&
              orderStatus !== null &&
              "error" in orderStatus
            ) {
              specificError = orderStatus.error;
            }
            // Use asserted responseData here as well for consistency if needed, though statuses is already derived
            console.warn(
              `Cancel request for OID ${
                order.oid
              } did not succeed. Status/Error: ${JSON.stringify(orderStatus)}`,
              responseData
            );
            toast.warning(
              `Cancellation failed for OID ${order.oid}: ${specificError}`
            );
          }
        } else if (result.response.type === "error") {
          // Handle cases where status is ok but response type is error
          const errorMsg = `Failed to cancel order ${order.oid}. Error: ${
            (result.response as any).error || "Unknown error"
          }`;
          throw new Error(errorMsg);
        } else {
          // Handle unexpected response type
          throw new Error(
            `Failed to cancel order ${order.oid}. Unexpected response type: ${result.response.type}`
          );
        }
      } else {
        // Handle top-level errors or non-object responses
        let errorMsg = `Failed to cancel order ${order.oid}.`;
        if (result.status !== "ok") {
          errorMsg += ` Status: ${result.status}`;
        } else {
          // If status is ok but response is not a recognized object structure
          errorMsg += ` Unexpected response format: ${JSON.stringify(
            result.response
          )}`;
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Failed to cancel order:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Unknown error during cancellation";
      toast.error(errorMsg);
    } finally {
      setCancellingOid(null);
    }
  };

  if (isClientLoading) {
    return (
      <Card className="bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading client...</span>
        </CardContent>
      </Card>
    );
  }

  if (!displayedOrders || displayedOrders.length === 0) {
    return (
      <Card className="bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800">
        <CardContent className="p-6 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">
            No open orders found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Open Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {" "}
        {/* Remove padding to allow table full width */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="px-2 py-2 w-[60px] text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cancel
              </TableHead>
              <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Asset
              </TableHead>
              <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Side
              </TableHead>
              <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </TableHead>
              <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Size
              </TableHead>
              <TableHead className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Order Value
              </TableHead>
              <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Timestamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedOrders.map(order => (
              <TableRow
                key={order.oid}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <TableCell className="px-2 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                    onClick={() => handleCancelOrder(order)}
                    disabled={cancellingOid === order.oid}
                  >
                    {cancellingOid === order.oid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {order.asset}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
                  <Badge
                    variant={order.side === "S" ? "destructive" : "default"}
                    className={
                      order.side === "B"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700"
                        : ""
                    }
                  >
                    {order.side === "B" ? "Buy" : "Sell"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                  {formatPrice(order.limitPx)}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                  {formatSize(order.sz, order.asset)}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                  {formatOrderValue(order.sz, order.limitPx)}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div>{order.orderType}</div>
                  {order.isTrigger && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Trigger: {order.triggerCondition}{" "}
                      {formatPrice(order.triggerPx)}
                    </div>
                  )}
                  {order.reduceOnly && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Reduce Only
                    </div>
                  )}
                  {order.tif && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      TIF: {order.tif}
                    </div>
                  )}
                  {order.isPositionTpsl && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      (TP/SL)
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatTimestamp(order.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
