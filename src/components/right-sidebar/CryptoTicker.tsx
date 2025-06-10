import React from "react";

import Image from "next/image";

import { TrendingDown, TrendingUp } from "lucide-react";

import { TokenPrice } from "./CryptoMarket";

const TOKEN_ICONS = {
  btc: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  eth: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  sol: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  ada: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  dot: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  avax: "https://assets.coingecko.com/coins/images/12559/small/avalanche-avatar.png",
  link: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  matic:
    "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  uni: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
  aave: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
};

function CryptoTicker({ prices }: { prices: TokenPrice[] }) {
  const duplicatedPrices = [...prices, ...prices, ...prices];

  return (
    <div className="h-16 bg-white dark:bg-black overflow-hidden">
      <div className="relative flex items-center h-full">
        {/* Ticker content */}
        <div className="ticker-scroll flex animate-ticker gap-4 absolute left-0 whitespace-nowrap py-2">
          {duplicatedPrices.map((token, index) => (
            <div
              key={`${token.id}-${index}`}
              className="inline-flex flex-col justify-center px-4 py-1 
                bg-primary/5 hover:bg-primary/15
                rounded-lg transition-all duration-200 
                group h-12"
            >
              {/* Top row: Symbol, trend icon, and percentage */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-4 h-4 rounded-full overflow-hidden">
                  <Image
                    src={
                      TOKEN_ICONS[
                        token.symbol.toLowerCase() as keyof typeof TOKEN_ICONS
                      ]
                    }
                    alt={token.symbol}
                    width={16}
                    height={16}
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="font-medium text-xs text-black dark:text-white">
                  {token.symbol.toUpperCase()}
                </span>

                <div
                  className={`flex items-center text-xs font-medium ${
                    token.price_change_percentage_24h >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {token.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {Math.abs(token.price_change_percentage_24h).toFixed(1)}%
                </div>
              </div>

              {/* Bottom row: Price */}
              <div className="font-bold text-xs text-black dark:text-white">
                $
                {token.current_price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CryptoTicker;
