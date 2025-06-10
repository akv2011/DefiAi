import { formatEther, formatUnits } from "viem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Chain } from "@/lib/chains";

interface MarketInfo {
  cToken: string;
  underlyingToken: string;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: string;
  supplyRatePerBlock: string;
  borrowRatePerBlock: string;
  totalSupply: string;
  totalBorrow: string;
  collateralFactor: string;
  exchangeRate: string;
}

interface MarketsInfoCardProps {
  chain: Chain;
  markets: MarketInfo[];
}

export function MarketsInfoCard({ chain, markets }: MarketsInfoCardProps) {
  const formatAPY = (ratePerBlock: string) => {
    // Convert rate per block to APY
    // Assuming ~2s block time, so ~15,768,000 blocks per year
    // First scale down the rate by 1e18
    const scaledRate = Number(formatEther(BigInt(ratePerBlock)));
    const ratePerYear = scaledRate * 15768000;
    return (ratePerYear * 100).toFixed(2);
  };

  const formatAmount = (amount: string, decimals: string) => {
    const formatted = formatUnits(BigInt(amount), Number(decimals));
    return Number(formatted).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="mb-4 bg-black border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium capitalize text-white">
          {chain} Markets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {markets.map(market => (
            <Card key={market.cToken} className="bg-black">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between text-white">
                  <span>{market.underlyingSymbol}</span>
                  <span className="text-xs text-gray-500">
                    {market.underlyingName}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Supply APY</div>
                    <div className="text-sm font-medium text-emerald-600">
                      {formatAPY(market.supplyRatePerBlock)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Borrow APY</div>
                    <div className="text-sm font-medium text-red-600">
                      {formatAPY(market.borrowRatePerBlock)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Total Supply
                    </div>
                    <div className="text-sm text-white">
                      {formatAmount(
                        market.totalSupply,
                        market.underlyingDecimals
                      )}{" "}
                      {market.underlyingSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Total Borrow
                    </div>
                    <div className="text-sm text-white">
                      {formatAmount(
                        market.totalBorrow,
                        market.underlyingDecimals
                      )}{" "}
                      {market.underlyingSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Collateral Factor
                    </div>
                    <div className="text-sm text-white">
                      {(
                        Number(formatEther(BigInt(market.collateralFactor))) *
                        100
                      ).toFixed(0)}
                      %
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
