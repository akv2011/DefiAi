import {
  arbitrum,
  base,
  mainnet,
  mode,
  optimism,
  sonic,
  Chain as vChain,
} from "viem/chains";

export const chainIdToName: Record<number, string> = {
  [base.id]: "Base",
  [mode.id]: "Mode",
  [mainnet.id]: "Mainnet",
  [arbitrum.id]: "Arbitrum",
  [optimism.id]: "Optimism",
  [sonic.id]: "Sonic",
} as const;

export const CHAINS = Object.values(chainIdToName).map(c =>
  c.toLowerCase()
) as [string, ...string[]];

export const CHAIN_IDS = Object.keys(chainIdToName).map(Number);

export type Chain = (typeof CHAINS)[number];

export const chainNameToChain: Record<string, vChain> = {
  base,
  mode,
  mainnet,
  arbitrum,
  optimism,
  sonic,
};

export const getChainImagePath = (chain: string) => {
  return `/chains/${chain.toLowerCase()}.png`;
};

export const BLOCK_EXPLORER_URLS: Record<string, string> = {
  mode: "https://explorer.mode.network",
  base: "https://basescan.org",
  mainnet: "https://etherscan.io",
  arbitrum: "https://arbiscan.io",
  optimism: "https://optimistic.etherscan.io",
  sonic: "https://sonicscan.org",
} as const;
