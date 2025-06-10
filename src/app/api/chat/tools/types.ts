import { Message, ToolInvocation } from "ai";
import { Address, PublicClient, createPublicClient, http } from "viem";
import { arbitrum, base, mainnet, mode, optimism, sonic } from "viem/chains";

import { Chain } from "@/lib/chains";

export type Protocol = "ionic" | "morpho" | "aave";

export type Token = {
  token: string;
  chain: Chain;
};

export interface MarketInfo {
  cToken: Address;
  underlyingToken: Address;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: bigint;
  underlyingBalance: bigint;
  supplyRatePerBlock: bigint;
  borrowRatePerBlock: bigint;
  totalSupply: bigint;
  totalBorrow: bigint;
  supplyBalance: bigint;
  borrowBalance: bigint;
  liquidity: bigint;
  membership: boolean;
  exchangeRate: bigint;
  underlyingPrice: bigint;
  oracle: Address;
  collateralFactor: bigint;
  reserveFactor: bigint;
  adminFee: bigint;
  ionicFee: bigint;
  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;
}

export interface SerializedMarketInfo {
  cToken: Address;
  underlyingToken: Address;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: string;
  underlyingBalance: string;
  supplyRatePerBlock: string;
  borrowRatePerBlock: string;
  totalSupply: string;
  totalBorrow: string;
  supplyBalance: string;
  borrowBalance: string;
  liquidity: string;
  membership: boolean;
  exchangeRate: string;
  underlyingPrice: string;
  oracle: string;
  collateralFactor: string;
  reserveFactor: string;
  adminFee: string;
  ionicFee: string;
  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;
}

export interface PoolAsset {
  cToken: Address;
  underlyingToken: Address;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: bigint;
  underlyingBalance: bigint;
  supplyRatePerBlock: bigint;
  borrowRatePerBlock: bigint;
  totalSupply: bigint;
  totalBorrow: bigint;
  supplyBalance: bigint;
  borrowBalance: bigint;
  liquidity: bigint;
  membership: boolean;
  exchangeRate: bigint;
  underlyingPrice: bigint;
  oracle: Address;
  collateralFactor: bigint;
  reserveFactor: bigint;
  adminFee: bigint;
  ionicFee: bigint;
  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;
}

export interface SerializedPoolAsset {
  cToken: string;
  underlyingToken: string;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: string;
  underlyingBalance: string;
  supplyRatePerBlock: string;
  borrowRatePerBlock: string;
  totalSupply: string;
  totalBorrow: string;
  supplyBalance: string;
  borrowBalance: string;
  liquidity: string;
  membership: boolean;
  exchangeRate: string;
  underlyingPrice: string;
  oracle: string;
  collateralFactor: string;
  reserveFactor: string;
  adminFee: string;
  ionicFee: string;
  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;
}

// Clients
export const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const modeClient = createPublicClient({
  chain: mode,
  transport: http(),
});

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

export const optimismClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

export const sonicClient = createPublicClient({
  chain: sonic,
  transport: http(),
});

export const clients: Record<Chain, PublicClient> = {
  base: baseClient as PublicClient,
  mode: modeClient as PublicClient,
  mainnet: mainnetClient as PublicClient,
  arbitrum: arbitrumClient as PublicClient,
  optimism: optimismClient as PublicClient,
  sonic: sonicClient as PublicClient,
};

// Contract addresses
export const poolLenses: Record<Chain, Address | undefined> = {
  base: "0x6ec80f9aCd960b568932696C0F0bE06FBfCd175a",
  mode: "0x70BB19a56BfAEc65aE861E6275A90163AbDF36a6",
  mainnet: undefined,
  arbitrum: undefined,
  optimism: undefined,
  sonic: undefined,
};

export const comptrollers: Record<Chain, Address | undefined> = {
  base: "0x05c9C6417F246600f8f5f49fcA9Ee991bfF73D13",
  mode: "0xfb3323e24743caf4add0fdccfb268565c0685556",
  mainnet: undefined,
  arbitrum: undefined,
  optimism: undefined,
  sonic: undefined,
};

// Helper function to handle tool errors
export function handleToolError(error: unknown, toolName: string): never {
  console.error(`${toolName} error:`, error);
  throw error;
}

export type TransactionData = {
  to: Address;
  data: string;
  chain: Chain;
  description: string;
  hash?: string;
  status?: "pending" | "completed" | "failed";
  value?: string;
};

export type TextUIPart = {
  type: "text";
  text: string;
};
export type ReasoningUIPart = {
  type: "reasoning";
  reasoning: string;
};
export type ToolInvocationUIPart = {
  type: "tool-invocation";
  toolInvocation: ToolInvocation;
};

export type UIMessage = Message & {
  parts: Array<TextUIPart | ReasoningUIPart | ToolInvocationUIPart>;
  mode?: "morpheus" | "sentinel";
  revisionId?: string;
};
