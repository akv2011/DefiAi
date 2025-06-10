import { useEffect, useState } from "react";

import TradingViewWidget from "@/components/shared/TradingViewWidget";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HyperliquidPosition = {
  symbol: string;
  entryPrice: number;
  markPrice: number;
  size: number;
  side: "long" | "short";
  leverage: number;
  leverageType: string;
  maxLeverage?: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  marginUsed: number;
  positionValue: number;
  fundingRate: number;
  fundingPaid: number;
  fundingSinceOpen: number;
  fundingSinceChange: number;
  roe: number;
  positionId: string;
};

type HyperliquidMarginSummary = {
  accountValue: string;
  totalMarginUsed: string;
  totalNtlPos: string;
  totalRawUsd: string;
};

type HyperliquidCrossMarginSummary = {
  accountValue: string;
  totalMarginUsed: string;
  totalNtlPos: string;
  totalRawUsd: string;
};

type ClearinghouseState = {
  marginSummary: HyperliquidMarginSummary;
  crossMarginSummary: HyperliquidCrossMarginSummary;
  positions: HyperliquidPosition[]; // Uses the assumed HyperliquidPosition type
};

interface HyperliquidPositionsCardProps {
  accountState: ClearinghouseState;
}

export function HyperliquidPositionsCard({
  accountState,
}: HyperliquidPositionsCardProps) {
  console.log("🚀 ~ accountState:", accountState);
  const formatUsd = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Extract positions for easier access
  const { positions, marginSummary } = accountState;

  // Calculate total PnL from positions
  const totalPnl = positions.reduce(
    (sum: number, position: HyperliquidPosition) =>
      sum + position.unrealizedPnl,
    0
  );

  // Use totalMarginUsed from marginSummary (convert string to number)
  const totalMarginUsed = parseFloat(marginSummary.totalMarginUsed);

  // Calculate available balance
  const totalBalance = parseFloat(marginSummary.accountValue);
  const availableBalance = totalBalance - totalMarginUsed;

  // State for the selected symbol for the TradingView chart
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Effect to set the initial symbol when positions load
  useEffect(() => {
    if (positions.length > 0 && !selectedSymbol) {
      setSelectedSymbol(positions[0].symbol);
    } else if (positions.length === 0) {
      setSelectedSymbol(null); // Reset if no positions
    }
  }, [positions, selectedSymbol]);

  // Extract unique symbols for the dropdown
  const uniqueSymbols = Array.from(new Set(positions.map(p => p.symbol)));

  return (
    <div className="space-y-4">
      <Card className="bg-gray-50 border-gray-200 dark:bg-black dark:border-gray-800 mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Hyperliquid Positions Summary
          </CardTitle>
          <div className="flex justify-between items-center">
            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {positions.length} Active Positions
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Balance: {formatUsd(totalBalance)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Available Balance: {formatUsd(availableBalance)}
              </div>
              <div
                className={`text-sm ${
                  totalPnl >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                Unrealized PnL: {formatUsd(totalPnl)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* TradingView Widget and Symbol Selector */}
      {positions.length > 0 && selectedSymbol && (
        <Card className="bg-gray-50 border-gray-200 dark:bg-black dark:border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Chart: {selectedSymbol}
              </CardTitle>
              <Select
                value={selectedSymbol}
                onValueChange={value => setSelectedSymbol(value)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Select Symbol" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSymbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol} className="text-xs">
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {" "}
            {/* Remove padding for the chart */}
            <TradingViewWidget
              symbol={
                selectedSymbol.startsWith("k")
                  ? selectedSymbol.slice(1)
                  : selectedSymbol
              }
              interval="60"
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {positions.length > 0 ? (
        <Card className="bg-gray-50 border-gray-200 dark:bg-black dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {positions.map((position: HyperliquidPosition, index: number) => {
                return (
                  <div
                    key={position.positionId || `${position.symbol}-${index}`}
                    className="bg-white dark:bg-black rounded-lg p-4 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {position.symbol}
                        </span>
                        <Badge
                          variant={
                            position.side === "long" ? "default" : "destructive"
                          }
                          className="capitalize"
                        >
                          {position.side}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {position.leverage}x
                        </Badge>
                        {position.leverageType && (
                          <Badge variant="secondary" className="capitalize">
                            {position.leverageType}
                          </Badge>
                        )}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          position.unrealizedPnl >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatUsd(position.unrealizedPnl)} (
                        {formatPercentage(position.roe || 0)}
                        ROE)
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Size:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {position.size.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Margin:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatUsd(position.marginUsed)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Entry Price:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatUsd(position.entryPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Mark Price:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatUsd(position.markPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Liquidation:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatUsd(position.liquidationPrice)}
                        </span>
                      </div>

                      {position.positionValue !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Position Value:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatUsd(position.positionValue)}
                          </span>
                        </div>
                      )}

                      {position.fundingRate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Funding Rate:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatPercentage(position.fundingRate)}
                          </span>
                        </div>
                      )}

                      {position.fundingPaid !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Funding Paid (All Time):
                          </span>
                          <span
                            className={`font-medium ${
                              position.fundingPaid > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatUsd(Math.abs(position.fundingPaid))}
                            {position.fundingPaid > 0 ? " paid" : " received"}
                          </span>
                        </div>
                      )}

                      {position.fundingSinceOpen !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Funding Since Open:
                          </span>
                          <span
                            className={`font-medium ${
                              position.fundingSinceOpen > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatUsd(Math.abs(position.fundingSinceOpen))}
                            {position.fundingSinceOpen > 0
                              ? " paid"
                              : " received"}
                          </span>
                        </div>
                      )}

                      {position.fundingSinceChange !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Funding Since Change:
                          </span>
                          <span
                            className={`font-medium ${
                              position.fundingSinceChange > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatUsd(Math.abs(position.fundingSinceChange))}
                            {position.fundingSinceChange > 0
                              ? " paid"
                              : " received"}
                          </span>
                        </div>
                      )}

                      {position.maxLeverage !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Max Leverage:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {position.maxLeverage}x
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-gray-200 dark:bg-black dark:border-gray-800">
          <CardContent className="py-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              No open positions on Hyperliquid
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
