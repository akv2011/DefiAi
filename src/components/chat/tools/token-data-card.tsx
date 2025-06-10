import React from "react";

import Image from "next/image";

import { BarChart3, Info, Layers } from "lucide-react";

import TradingViewWidget, {
  getChartHeight,
} from "@/components/shared/TradingViewWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Chain } from "@/lib/chains";
import { formatLargeNumber } from "@/lib/utils";

import { MessageMode } from "@/contexts/chat-context";

interface TokenMetricsResponseType {
  token: {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: null;
    last_updated: string;
    platforms: {
      [key: string]: string;
    };
  };
  cacheInfo: {
    lastUpdated: string;
  };
}

interface TokenDataCardProps {
  chain: Chain;
  data: TokenMetricsResponseType["token"];
  activeMode: MessageMode;
  inSidebar?: boolean;
}

function TokenDataContent({ chain, data, activeMode }: TokenDataCardProps) {
  return (
    <Card
      className={`mb-4 bg-gray-50 dark:bg-black ${
        activeMode === "sentinel"
          ? "border-indigo-200 dark:border-indigo-800"
          : "border-emerald-200 dark:border-emerald-800"
      } max-w-full overflow-hidden`}
      onClick={e => {
        e.stopPropagation();
        // updateChart();
      }}
    >
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 dark:text-white">
          {data.image && (
            <Image
              src={data.image}
              alt={data.symbol}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span>{data.symbol}</span>
          {chain && (
            <span className="text-xs text-gray-500 dark:text-gray-300">
              on {chain}
            </span>
          )}
          {data.current_price && (
            <span className="ml-auto text-sm font-semibold">
              $
              {Number(data.current_price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            </span>
          )}
          {data.price_change_percentage_24h && (
            <span
              className={`text-xs font-semibold ${
                parseFloat(String(data.price_change_percentage_24h)) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {parseFloat(String(data.price_change_percentage_24h)) >= 0
                ? "+"
                : ""}
              {parseFloat(String(data.price_change_percentage_24h)).toFixed(2)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-0 pb-3">
        {/* Chart Section */}
        <div
          className="mb-4"
          style={{
            minHeight: `${getChartHeight()}px`,
            height: `${getChartHeight()}px`,
          }}
        >
          <TradingViewWidget symbol={data.symbol.toUpperCase()} />
        </div>

        {/* Compact Token Data Tabs */}
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Token Identity */}
            <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center">
                <Info
                  className={`h-3 w-3 mr-1 ${
                    activeMode === "sentinel"
                      ? "text-indigo-500"
                      : "text-emerald-500"
                  }`}
                />
                Token Identity
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Name</span>
                  <span className="font-medium dark:text-white">
                    {data.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <div className="mt-1 font-mono py-1 px-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300 break-all text-xs">
                    {data.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Stats */}
            <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center">
                <BarChart3
                  className={`h-3 w-3 mr-1 ${
                    activeMode === "sentinel"
                      ? "text-indigo-500"
                      : "text-emerald-500"
                  }`}
                />
                Market Stats
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {data.total_volume && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-500 dark:text-gray-400">
                      24h Volume
                    </div>
                    <div className="font-medium dark:text-white">
                      ${formatLargeNumber(data.total_volume)}
                    </div>
                  </div>
                )}
                {data.market_cap && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-500 dark:text-gray-400">
                      Market Cap
                    </div>
                    <div className="font-medium dark:text-white">
                      ${formatLargeNumber(data.market_cap)}
                    </div>
                  </div>
                )}
                {data.fully_diluted_valuation && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-500 dark:text-gray-400">FDV</div>
                    <div className="font-medium dark:text-white">
                      ${formatLargeNumber(data.fully_diluted_valuation)}
                    </div>
                  </div>
                )}
                {data.circulating_supply && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                    <div className="text-gray-500 dark:text-gray-400">
                      Circulating Supply
                    </div>
                    <div className="font-medium dark:text-white">
                      {formatLargeNumber(data.circulating_supply)}{" "}
                      {data.symbol.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stats */}
            <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center">
                <Layers
                  className={`h-3 w-3 mr-1 ${
                    activeMode === "sentinel"
                      ? "text-indigo-500"
                      : "text-emerald-500"
                  }`}
                />
                Additional Stats
              </h3>
              <div className="space-y-2 text-xs">
                {data.market_cap_rank && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Market Cap Rank
                    </span>
                    <span className="font-medium dark:text-white">
                      #{data.market_cap_rank}
                    </span>
                  </div>
                )}
                {data.ath && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      All Time High
                    </span>
                    <span className="font-medium dark:text-white">
                      ${formatLargeNumber(data.ath)}
                    </span>
                  </div>
                )}
                {data.ath_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      ATH Date
                    </span>
                    <span className="font-medium dark:text-white">
                      {new Date(data.ath_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {data.total_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Total Supply
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatLargeNumber(data.total_supply)}
                    </span>
                  </div>
                )}
                {data.max_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Max Supply
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatLargeNumber(data.max_supply)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading component for token data placeholder
const TokenDataLoading = () => (
  <Card className="mb-4 bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 max-w-full overflow-hidden p-6">
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent"></div>
      <p className="text-gray-600 dark:text-gray-300 text-center">
        Loading token metrics...
      </p>
    </div>
  </Card>
);

// Main component that handles conditional rendering
export function TokenDataCard(props: TokenDataCardProps) {
  // Conditionally render loading state or content
  if (props.data && "loading" in props.data) {
    return <TokenDataLoading />;
  }

  return <TokenDataContent {...props} />;
}
