import { isAddress } from "viem";

type TokenCacheEntry = {
  symbol: string;
  name?: string;
  timestamp: number;
};

type TokenCache = Record<string, TokenCacheEntry>;

const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
const tokenCache: TokenCache = {};

export const shortenAddress = (address: string): string => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export async function getTokenInfo(
  address: string,
  chainId: string = "ethereum"
): Promise<{ symbol: string; name?: string }> {
  if (!isAddress(address)) {
    return { symbol: address };
  }

  const normalizedAddress = address.toLowerCase();

  const cacheKey = `${chainId}:${normalizedAddress}`;
  const cachedToken = tokenCache[cacheKey];

  if (cachedToken && Date.now() - cachedToken.timestamp < CACHE_EXPIRY) {
    return {
      symbol: cachedToken.symbol,
      name: cachedToken.name,
    };
  }

  try {
    const platformIdMap: Record<string, string> = {
      ethereum: "ethereum",
      mainnet: "ethereum",
      arbitrum: "arbitrum-one",
      base: "base",
      optimism: "optimistic-ethereum",
      polygon: "polygon-pos",
      mode: "mode-network",
      sonic: "sonic-network",
    };

    const platformId = platformIdMap[chainId.toLowerCase()] || "ethereum";

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${platformId}/contract/${normalizedAddress}`
    );

    if (response.ok) {
      const data = await response.json();

      tokenCache[cacheKey] = {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        timestamp: Date.now(),
      };

      return {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
      };
    }

    const fallbackSymbol = shortenAddress(address);
    tokenCache[cacheKey] = {
      symbol: fallbackSymbol,
      timestamp: Date.now(),
    };

    return { symbol: fallbackSymbol };
  } catch (error) {
    console.error("Error fetching token info:", error);
    return { symbol: shortenAddress(address) };
  }
}

export async function resolveTokenSymbol(
  address: string,
  chainId?: string
): Promise<string> {
  try {
    const info = await getTokenInfo(address, chainId);
    return info.symbol;
  } catch (error) {
    console.error("Error resolving token symbol:", error);
    throw error;
  }
}
