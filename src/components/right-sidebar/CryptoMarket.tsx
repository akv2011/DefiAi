import React from "react";

import { useMarketData } from "@/contexts/market-data";

import CryptoTicker from "./CryptoTicker";

export interface TokenPrice {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function LiveMarketData() {
  const { news, prices, isLoading, error } = useMarketData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-pulse text-primary">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error.toString()}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col flex-1 overflow-hidden">
      {prices && (
        <>
          <CryptoTicker prices={prices} />
          <div className="h-px bg-gray-200 dark:bg-gray-800" />
        </>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto pl-3 pr-2 pb-4 space-y-2 gap-2 pt-4">
        {news.length > 0 ? (
          news.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 
                border border-gray-200 dark:border-gray-800 
                hover:border-primary/50 dark:hover:border-primary/50 transition-all"
            >
              <h4 className="font-medium text-sm mb-2">{item.title}</h4>
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(item.published_at).toLocaleString()}</span>
                <span>{item.domain}</span>
              </div>
              {item.currencies && item.currencies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ...new Set(item.currencies.map(currency => currency.code)),
                  ].map((code, idx) => (
                    <span
                      key={`${code}-${idx}`}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No news available</p>
        )}
      </div>
    </div>
  );
}
