import { ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TokenMarketData {
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  description: string;
  links: {
    website: string;
    explorer: string;
    forum: string;
    twitter: string;
    telegram: string;
  };
  lastUpdated: string;
}

interface TokenMarketDataCardProps {
  data: TokenMarketData | { error: string };
}

export function TokenMarketDataCard({ data }: TokenMarketDataCardProps) {
  if ("error" in data) {
    return <div className="text-red-500">{data.error}</div>;
  }

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(decimals)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(decimals)}M`;
    }
    if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(decimals)}K`;
    }
    return `$${num.toFixed(decimals)}`;
  };

  const formatPercentage = (num: number) => {
    const color = num >= 0 ? "text-emerald-500" : "text-red-500";
    return <span className={color}>{num.toFixed(2)}%</span>;
  };

  return (
    <Card className="mb-4 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between dark:text-white">
          <div className="flex items-center gap-2">
            <span>{data.name}</span>
            <span className="text-gray-500">({data.symbol.toUpperCase()})</span>
          </div>
          <div className="text-2xl font-bold">
            $
            {data.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {data.marketCap && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Market Cap
              </div>
              <div className="text-sm font-medium dark:text-white">
                {formatNumber(data.marketCap)}
              </div>
            </div>
          )}
          {data.volume24h && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                24h Volume
              </div>
              <div className="text-sm font-medium dark:text-white">
                {formatNumber(data.volume24h)}
              </div>
            </div>
          )}
          {data.priceChange24h && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                24h Change
              </div>
              <div className="text-sm font-medium">
                {formatPercentage(data.priceChange24h)}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {data.priceChange7d && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                7d Change
              </div>
              <div className="text-sm font-medium">
                {formatPercentage(data.priceChange7d)}
              </div>
            </div>
          )}
          {data.priceChange30d && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                30d Change
              </div>
              <div className="text-sm font-medium">
                {formatPercentage(data.priceChange30d)}
              </div>
            </div>
          )}
          {data.lastUpdated && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Last Updated
              </div>
              <div className="text-sm font-medium dark:text-white">
                {new Date(data.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {data.circulatingSupply && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Circulating Supply
              </div>
              <div className="text-sm font-medium dark:text-white">
                {data.circulatingSupply.toLocaleString()} {data.symbol}
              </div>
            </div>
          )}
          {data.totalSupply && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Total Supply
              </div>
              <div className="text-sm font-medium dark:text-white">
                {data.totalSupply.toLocaleString()} {data.symbol}
              </div>
            </div>
          )}
          {data.maxSupply && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Max Supply
              </div>
              <div className="text-sm font-medium dark:text-white">
                {data.maxSupply.toLocaleString()} {data.symbol}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Description
          </div>
          <div className="text-sm dark:text-white line-clamp-3">
            {data.description}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Links
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.links).map(([key, value]) => {
              if (!value) return null;
              return (
                <a
                  key={key}
                  href={
                    key === "twitter"
                      ? `https://twitter.com/${value}`
                      : key === "telegram"
                        ? `https://t.me/${value}`
                        : value
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <span className="capitalize">{key}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
