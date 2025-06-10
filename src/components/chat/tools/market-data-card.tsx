import Image from "next/image";

import { Info } from "lucide-react";
import { formatUnits, getAddress, isAddress as viemIsAddress } from "viem";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getChainImagePath } from "@/lib/chains";
import { formatLargeNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

import { useMediaQuery } from "@/hooks/useMediaQuery";

// Types
export type MarketReward = {
  rewardTokenSymbol: string;
  rewardTokenAddress: string;
  rewardApr: string;
};

export type MarketAsset = {
  underlyingSymbol: string;
  totalSupply: string;
  totalSupplyUsd: string;
  totalBorrow: string;
  totalBorrowUsd: string;
  liquidity: string;
  liquidityUsd: string;
  supplyApy: string;
  borrowApy: string;
  isCollateral: boolean;
  ltv: string;
  rewards: MarketReward[];
};

export type MarketPool = {
  name: string;
  poolId: string;
  totalValueUsd: number;
  assets: MarketAsset[];
};

export type ChainMarkets = {
  chain: string;
  pools: MarketPool[];
};

export type ProtocolPools = {
  protocol: string;
  chains: ChainMarkets[];
};

export type AggregatedMarketsResponse = {
  protocols: ProtocolPools[];
};

interface MarketDataCardProps {
  markets: AggregatedMarketsResponse;
  messageMode?: string;
}

const formatApy = (apy: string | number) => {
  const value = typeof apy === "string" ? parseFloat(apy) : apy;
  return value.toFixed(2) + "%";
};

const formatUsd = (amount: string | number) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "$0";
  if (value >= 1_000_000) return "$" + formatLargeNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getTokenDecimals = (
  symbol: string,
  declaredDecimals?: number
): number => {
  if (declaredDecimals !== undefined) return declaredDecimals;
  if (
    symbol === "USDC" ||
    symbol === "USDC.e" ||
    symbol === "USDT" ||
    symbol.includes("USD")
  ) {
    return 6;
  }
  return 18;
};

const formatAmount = (
  amount: string | number,
  declaredDecimals?: number,
  symbol?: string
) => {
  if (!amount || amount === "0") return "0";
  const amountStr = typeof amount === "number" ? amount.toString() : amount;
  const decimals = getTokenDecimals(symbol || "", declaredDecimals);

  try {
    const value = Number(formatUnits(BigInt(amountStr), decimals));
    if (value < 0.01) return "< 0.01";
    if (value >= 1_000_000) return formatLargeNumber(value);
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  } catch (error) {
    console.error("Error formatting amount:", error, { amount, decimals });
    return amountStr;
  }
};

const parseNumber = (value: string | number) => {
  return typeof value === "string" ? parseFloat(value) : value;
};

const isAddress = (str: string) => viemIsAddress(str);

const formatAddress = (address: string) => {
  if (!isAddress(address)) return address;
  try {
    const checksummed = getAddress(address);
    return `${checksummed.substring(0, 4)}...${checksummed.substring(checksummed.length - 4)}`;
  } catch {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }
};

const formatTokenName = (symbol: string) => {
  return isAddress(symbol) ? formatAddress(symbol) : symbol;
};

export function MarketDataCard({ markets, messageMode }: MarketDataCardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const mode = messageMode || "teal";

  // Helper function to get combined rewards display
  const getRewardsDisplay = (asset: MarketAsset, type: "supply" | "borrow") => {
    const filteredRewards = asset.rewards.filter(
      r => parseNumber(r.rewardApr) > 0
    );

    if (filteredRewards.length === 0) return null;

    return (
      <div
        className={`text-2xs ${
          type === "supply" ? "text-emerald-600" : "text-red-600"
        } dark:${type === "supply" ? "text-emerald-400" : "text-red-400"}`}
      >
        {filteredRewards.map((reward, idx) => (
          <div
            key={reward.rewardTokenAddress || idx}
            className="flex items-center"
          >
            <span className="mr-0.5">+</span>
            <span>{formatApy(reward.rewardApr)}</span>
            {reward.rewardTokenSymbol && (
              <span className="ml-0.5 truncate max-w-12">
                {formatTokenName(reward.rewardTokenSymbol)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="overflow-y-auto max-h-[80vh]">
        {markets.protocols.map(protocolData =>
          protocolData.chains.map(chainData => (
            <div
              key={`${protocolData.protocol}-${chainData.chain}`}
              className="mb-6 last:mb-0"
            >
              <div className="flex items-center gap-2 p-2 mb-3 bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800">
                <Image
                  src={getChainImagePath(chainData.chain)}
                  alt={chainData.chain}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-sm font-medium capitalize">
                  {chainData.chain}
                </span>
              </div>

              <div className="mb-8 last:mb-0">
                <div className="flex items-center mb-3">
                  <span className="text-xs font-semibold capitalize bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm">
                    {protocolData.protocol}
                  </span>
                </div>

                {chainData.pools.map((pool, poolIdx) => (
                  <div
                    key={`${chainData.chain}-${protocolData.protocol}-${poolIdx}`}
                    className="mb-5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {isAddress(pool.name) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <span>{formatAddress(pool.name)}</span>
                                  <Info className="h-3 w-3 ml-1 text-gray-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {pool.name}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            pool.name
                          )}
                        </span>
                      </div>
                      <div className="text-2xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        TVL: {formatUsd(pool.totalValueUsd)}
                      </div>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
                      {/* Header row */}
                      <div
                        className={cn(
                          "grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium border-b",
                          mode === "sentinel"
                            ? "bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-900"
                            : "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-900"
                        )}
                      >
                        {isMobile ? (
                          <>
                            <div className="col-span-4">Asset</div>
                            <div className="col-span-4 text-center">
                              Supply / Borrow
                            </div>
                            <div className="col-span-4 text-right">Stats</div>
                          </>
                        ) : (
                          <>
                            <div className="col-span-2">Asset</div>
                            <div className="col-span-2 text-center">
                              Supply APY
                            </div>
                            <div className="col-span-2 text-center">
                              Borrow APY
                            </div>
                            <div className="col-span-2 text-center">
                              Total Supply
                            </div>
                            <div className="col-span-2 text-center">
                              Total Borrow
                            </div>
                            <div className="col-span-2 text-right">
                              Liquidity
                            </div>
                          </>
                        )}
                      </div>

                      {/* Data rows */}
                      <div className="bg-white dark:bg-slate-950">
                        {pool.assets.map(asset => (
                          <div
                            key={`${chainData.chain}-${protocolData.protocol}-${pool.name}-${asset.underlyingSymbol}`}
                            className={cn(
                              "grid grid-cols-12 gap-2 px-3 py-2 border-b text-xs",
                              "hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors",
                              "last:border-b-0 border-gray-100 dark:border-slate-800"
                            )}
                          >
                            {isMobile ? (
                              <>
                                {/* Mobile view */}
                                <div className="col-span-4 flex flex-col">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="font-medium">
                                      {isAddress(asset.underlyingSymbol)
                                        ? formatAddress(asset.underlyingSymbol)
                                        : asset.underlyingSymbol}
                                    </span>
                                    {asset.isCollateral && (
                                      <Badge
                                        variant="secondary"
                                        className="text-2xs h-4 px-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      >
                                        Coll
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-2xs text-gray-500 dark:text-gray-400">
                                    LTV: {asset.ltv}
                                  </div>
                                </div>

                                <div className="col-span-4 flex flex-col items-center justify-center">
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {formatApy(asset.supplyApy)}
                                    </span>
                                    {getRewardsDisplay(asset, "supply")}
                                  </div>
                                  <div className="h-px w-8 bg-gray-200 dark:bg-slate-700 my-1"></div>
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                      {formatApy(asset.borrowApy)}
                                    </span>
                                    {getRewardsDisplay(asset, "borrow")}
                                  </div>
                                </div>

                                <div className="col-span-4 flex flex-col items-end justify-center text-2xs">
                                  <div className="flex flex-col items-end mb-1">
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Supply:
                                    </span>
                                    <span className="font-medium">
                                      {formatAmount(asset.totalSupply)}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">
                                      {formatUsd(asset.totalSupplyUsd)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Borrow:
                                    </span>
                                    <span className="font-medium">
                                      {formatAmount(asset.totalBorrow)}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">
                                      {formatUsd(asset.totalBorrowUsd)}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Desktop view */}
                                <div className="col-span-2 flex items-center gap-1">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">
                                        {isAddress(asset.underlyingSymbol)
                                          ? formatAddress(
                                              asset.underlyingSymbol
                                            )
                                          : asset.underlyingSymbol}
                                      </span>
                                      {asset.isCollateral && (
                                        <Badge
                                          variant="secondary"
                                          className="text-2xs h-4 px-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        >
                                          Coll
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-2xs text-gray-500 dark:text-gray-400">
                                      LTV: {asset.ltv}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-span-2 flex flex-col items-center justify-center">
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatApy(asset.supplyApy)}
                                  </span>
                                  {getRewardsDisplay(asset, "supply")}
                                </div>

                                <div className="col-span-2 flex flex-col items-center justify-center">
                                  <span className="font-semibold text-red-600 dark:text-red-400">
                                    {formatApy(asset.borrowApy)}
                                  </span>
                                  {getRewardsDisplay(asset, "borrow")}
                                </div>

                                <div className="col-span-2 flex flex-col items-center justify-center">
                                  <span className="font-medium">
                                    {formatAmount(asset.totalSupply)}
                                  </span>
                                  <span className="text-2xs text-gray-400 dark:text-gray-500">
                                    {formatUsd(asset.totalSupplyUsd)}
                                  </span>
                                </div>

                                <div className="col-span-2 flex flex-col items-center justify-center">
                                  <span className="font-medium">
                                    {formatAmount(asset.totalBorrow)}
                                  </span>
                                  <span className="text-2xs text-gray-400 dark:text-gray-500">
                                    {formatUsd(asset.totalBorrowUsd)}
                                  </span>
                                </div>

                                <div className="col-span-2 flex flex-col items-end justify-center">
                                  <span className="font-medium">
                                    {formatAmount(asset.liquidity)}
                                  </span>
                                  <span className="text-2xs text-gray-400 dark:text-gray-500">
                                    {formatUsd(asset.liquidityUsd)}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </TooltipProvider>
  );
}
