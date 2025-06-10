import React, { createContext, useContext } from "react";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

interface TokenPrice {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface CryptoNews {
  title: string;
  url: string;
  published_at: string;
  domain: string;
  currencies: Array<{
    code: string;
    title: string;
    slug: string;
  }>;
}

interface MarketContextType {
  prices: TokenPrice[];
  news: CryptoNews[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType>({
  prices: [],
  news: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
  refetch: async () => {},
});

// API fetching functions
const fetchPrices = async (): Promise<TokenPrice[]> => {
  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/coins/markets",
    {
      params: {
        vs_currency: "usd",
        ids: "bitcoin,ethereum,solana,cardano,polkadot,chainlink,polygon,uniswap,aave",
        order: "market_cap_desc",
        per_page: 10,
        page: 1,
        sparkline: false,
      },
    }
  );
  return data;
};

const fetchNews = async (): Promise<CryptoNews[]> => {
  const { data } = await axios.get("/api/cryptopanic");
  return data.results || [];
};

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export function MarketProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketDataProvider>{children}</MarketDataProvider>
    </QueryClientProvider>
  );
}

function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Query for prices
  const {
    data: prices = [],
    error: pricesError,
    isLoading: isPricesLoading,
  } = useQuery({
    queryKey: ["prices"],
    queryFn: fetchPrices,
    refetchInterval: 60000, // Refetch every minute
  });

  // Query for news
  const {
    data: news = [],
    error: newsError,
    isLoading: isNewsLoading,
  } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Combine errors if any
  const error =
    pricesError || newsError
      ? new Error(
          [
            pricesError && "Error fetching prices",
            newsError && "Error fetching news",
          ]
            .filter(Boolean)
            .join(", ")
        )
      : null;

  // Refetch all data
  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["prices"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["news"],
      }),
    ]);
  };

  const value = {
    prices,
    news,
    isLoading: isPricesLoading || isNewsLoading,
    error,
    lastUpdated: new Date(),
    refetch,
  };

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
}

export function useMarketData() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error("useMarketData must be used within a MarketProvider");
  }
  return context;
}

// Optional: Export a hook to access the QueryClient instance
export function useMarketQueryClient() {
  return useQueryClient();
}
