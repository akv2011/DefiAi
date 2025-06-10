import { formatEther, formatUnits } from "viem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SerializedPoolAsset } from "@/app/api/chat/tools/types";

interface MarketInfoCardProps {
  market: SerializedPoolAsset;
}

export function MarketInfoCard({ market }: MarketInfoCardProps) {
  const formatRate = (rate: string) => {
    const scaledRate = Number(formatEther(BigInt(rate)));
    const ratePerYear = scaledRate * 2102400; // blocks per year
    return (ratePerYear * 100).toFixed(2) + "%";
  };

  const formatAmount = (amount: string, decimals: string) => {
    return Number(formatUnits(BigInt(amount), Number(decimals))).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2,
      }
    );
  };

  const formatFactor = (factor: string) => {
    return (Number(formatEther(BigInt(factor))) * 100).toFixed(0) + "%";
  };

  return (
    <Card className="mb-4 bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium dark:text-white">
          {market.underlyingSymbol} Market Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-white">
              Supply Rate
            </div>
            <div className="text-sm dark:text-white">
              {formatRate(market.supplyRatePerBlock)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-white">
              Borrow Rate
            </div>
            <div className="text-sm dark:text-white">
              {formatRate(market.borrowRatePerBlock)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-white">
              Total Supply
            </div>
            <div className="text-sm dark:text-white">
              {formatAmount(market.totalSupply, market.underlyingDecimals)}{" "}
              {market.underlyingSymbol}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-white">
              Total Borrow
            </div>
            <div className="text-sm dark:text-white">
              {formatAmount(market.totalBorrow, market.underlyingDecimals)}{" "}
              {market.underlyingSymbol}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-white">
              Collateral Factor
            </div>
            <div className="text-sm dark:text-white">
              {formatFactor(market.collateralFactor)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-white">
              Reserve Factor
            </div>
            <div className="text-sm dark:text-white">
              {formatFactor(market.reserveFactor)}
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-white">
            Market Addresses
          </div>
          <div className="text-xs font-mono mt-1 dark:text-white">
            <div>cToken: {market.cToken}</div>
            <div>Underlying: {market.underlyingToken}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
