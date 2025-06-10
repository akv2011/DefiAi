import React, { ChangeEvent } from "react";

import Image from "next/image";

import { ExternalLink, Info } from "lucide-react";
import { isAddress as viemIsAddress } from "viem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getChainImagePath } from "@/lib/chains";
import { cn, formatLargeNumber } from "@/lib/utils";

import { useMediaQuery } from "@/hooks/useMediaQuery";

import { useChat } from "@/contexts/chat-context";

import { TOOL_INFO } from "@/constants/tools";

interface YieldReward {
  apy: string;
  symbol: string;
  address?: string;
}

interface YieldOpportunity {
  protocol: string;
  chain: string;
  assetSymbol: string;
  assetAddress?: string;
  apy: string;
  baseApy?: string;
  tvlUsd: number | string;
  availableLiquidityUsd?: string;
  totalDepositsUnits?: string;
  name: string;
  yieldType: string;
  rewards?: YieldReward[];
  vaultAddress?: string;
  link?: string;
}

interface YieldOpportunitiesCardProps {
  yieldData: {
    opportunities: YieldOpportunity[];
    filters?: {
      chain?: string;
      asset?: string;
      protocol?: string;
      minApy?: number;
      limit?: number;
    };
  };
  messageMode?: string;
}

const formatApy = (apy: string | undefined) => {
  if (apy === undefined || apy === null) return "-";
  const value = parseFloat(apy);
  if (isNaN(value)) return "-";
  return value.toFixed(2) + "%";
};

const formatUsd = (amount: string | number | undefined) => {
  if (amount === undefined || amount === null) return "$0";
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "$0";
  if (value < 0.01 && value > 0) return "< $0.01";
  if (value === 0) return "$0";
  return value >= 1_000_000
    ? "$" + formatLargeNumber(value)
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
};

const isAddress = (str: string) => viemIsAddress(str);

export function YieldOpportunitiesCard({
  yieldData,
  messageMode,
}: YieldOpportunitiesCardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeMode, setActiveMode, handleInputChange } = useChat();
  const mode = messageMode || activeMode;

  const formatFilters = () => {
    if (!yieldData.filters) return null;
    const filters = [];
    if (yieldData.filters.chain)
      filters.push(`Chain: ${yieldData.filters.chain}`);
    if (yieldData.filters.asset)
      filters.push(`Asset: ${yieldData.filters.asset}`);
    if (yieldData.filters.protocol)
      filters.push(`Protocol: ${yieldData.filters.protocol}`);
    if (yieldData.filters.minApy)
      filters.push(`Min APY: ${yieldData.filters.minApy}%`);
    return filters.length > 0 ? filters.join(" • ") : null;
  };

  if (!yieldData.opportunities || yieldData.opportunities.length === 0) {
    return (
      <Card className="bg-white border-gray-200 dark:bg-slate-950 dark:border-slate-800">
        <CardContent className="py-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No yield opportunities found
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to display APY breakdown
  const getApyDisplay = (opportunity: YieldOpportunity) => {
    const totalApyFormatted = formatApy(opportunity.apy);
    const baseApyFormatted = formatApy(opportunity.baseApy);
    const rewardApy = opportunity.rewards?.reduce(
      (sum, r) => sum + parseFloat(r.apy || "0"),
      0
    );
    const rewardApyFormatted = formatApy(rewardApy?.toString());

    const hasBreakdown =
      opportunity.baseApy !== undefined ||
      (rewardApy !== undefined && rewardApy > 0);

    return (
      <div className="flex flex-col items-end">
        <span
          className={cn(
            "font-medium",
            mode === "sentinel"
              ? "text-teal-600 dark:text-teal-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {totalApyFormatted}
        </span>
        {hasBreakdown && (
          <span className="text-2xs text-gray-500 dark:text-gray-400 mt-0.5">
            ({opportunity.baseApy !== undefined && `Base: ${baseApyFormatted}`}
            {opportunity.baseApy !== undefined &&
              rewardApy !== undefined &&
              rewardApy > 0 &&
              " + "}
            {rewardApy !== undefined &&
              rewardApy > 0 &&
              `Rewards: ${rewardApyFormatted}`}
            )
          </span>
        )}
      </div>
    );
  };

  const handleVaultClick = (opportunity: YieldOpportunity) => {
    const vaultDetails = {
      name: opportunity.name,
      protocol: opportunity.protocol,
      chain: opportunity.chain,
      asset: opportunity.assetSymbol,
      apy: opportunity.apy,
      tvl: opportunity.tvlUsd,
      vaultAddress: opportunity.vaultAddress,
      link: opportunity.link,
    };
    console.log("Vault clicked - Full opportunity data:", opportunity);
    console.log("Vault details:", vaultDetails);

    const userMessage = `Deposit ${opportunity.name || opportunity.protocol} vault on ${opportunity.chain} for ${opportunity.assetSymbol}`;
    handleInputChange({
      target: { value: userMessage, vaultDetails: vaultDetails },
    } as ChangeEvent<HTMLTextAreaElement> & { target: { vaultDetails: any } });

    setActiveMode("sentinel");
  };

  return (
    <Card className="bg-white border-gray-200 dark:bg-slate-950 dark:border-slate-800">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {TOOL_INFO.get_yield_opportunities.label}
          </CardTitle>
          {formatFilters() && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatFilters()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <div
            className={cn(
              "grid gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 py-2 border-b border-gray-100 dark:border-slate-800",
              isMobile ? "grid-cols-5" : "grid-cols-10"
            )}
          >
            {isMobile ? (
              <>
                <div className="col-span-3">Asset / Vault</div>
                <div className="col-span-2 text-right">APY</div>
              </>
            ) : (
              <>
                <div className="col-span-2">Asset</div>
                <div className="col-span-3">Vault Name</div>
                <div className="col-span-1">Chain</div>
                <div className="col-span-2 text-right">TVL / Liq.</div>
                <div className="col-span-2 text-right">APY</div>
              </>
            )}
          </div>
          <div>
            {yieldData.opportunities.map((opp, idx) => (
              <div
                key={`${opp.protocol}-${opp.assetSymbol}-${idx}-${opp.vaultAddress}`}
                onClick={() => handleVaultClick(opp)}
                className={cn(
                  "group relative grid gap-2 py-2 text-sm border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer",
                  isMobile ? "grid-cols-5" : "grid-cols-10"
                )}
              >
                {isMobile ? (
                  <>
                    <div className="col-span-3">
                      <div className="font-medium">
                        {opp.assetSymbol || "-"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {opp.name || opp.protocol || "-"}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      {getApyDisplay(opp)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="font-medium">
                        {opp.assetSymbol || "-"}
                      </span>
                      {opp.assetAddress && isAddress(opp.assetAddress) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>{opp.assetAddress}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="col-span-3 flex items-center text-gray-700 dark:text-gray-300">
                      <span className="truncate" title={opp.name}>
                        {opp.name || "-"}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center gap-1">
                      <Image
                        src={getChainImagePath(opp.chain)}
                        alt={opp.chain}
                        width={14}
                        height={14}
                        className="rounded-full"
                      />
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {opp.chain || "-"}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-gray-700 dark:text-gray-300">
                      <div>{formatUsd(opp.tvlUsd)}</div>
                      <div className="text-2xs">
                        {formatUsd(opp.availableLiquidityUsd)} Liq.
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      {getApyDisplay(opp)}
                    </div>
                  </>
                )}
                {opp.link && (
                  <a
                    href={opp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                      mode === "sentinel"
                        ? "text-indigo-500 hover:text-indigo-600"
                        : "text-emerald-500 hover:text-emerald-600"
                    )}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
