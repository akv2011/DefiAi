import { Address } from "viem";

import { Chain } from "@/lib/chains";

export interface ChainResult {
  chain: Chain;
}

export interface TransactionResult {
  data: Address;
  to: Address;
  chain: Chain;
  description: string;
}

export interface BalanceResult {
  balance: number;
  token: string;
  chain: string;
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

export interface PortfolioResult {
  base: SerializedPoolAsset[];
  mode: SerializedPoolAsset[];
}

export interface HyperliquidPosition {
  symbol: string;
  entryPrice: number;
  markPrice: number;
  size: number;
  side: "long" | "short";
  leverage: number;
  leverageType?: string;
  maxLeverage?: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  marginUsed: number;
  positionValue?: number;
  fundingRate?: number;
  fundingPaid?: number;
  fundingSinceOpen?: number;
  fundingSinceChange?: number;
  nextFundingTime?: number;
  roe?: number;
  positionId?: string;
}

export interface UIMessage {
  id: string;
  role: string;
  content: string;
}

export interface HyperliquidOrderType {
  limit?: {
    tif: "Alo" | "Ioc" | "Gtc";
  };
  trigger?: {
    isMarket: boolean;
    triggerPx: string;
    tpsl?: "tp" | "sl";
  };
}

export interface HyperliquidOrder {
  a: number; // Asset index
  b: boolean; // IsBuy
  p?: string; // Price
  s: string; // Size
  r: boolean; // ReduceOnly
  t: HyperliquidOrderType;
  c?: string; // Client order ID (optional)
}

export interface HyperliquidBuilder {
  b: string; // Builder address
  f: number; // Fee in tenths of a basis point
}

export interface HyperliquidCreateOrderParams {
  type: "order";
  orders: HyperliquidOrder[];
  grouping: "na" | "normalTpsl" | "positionTpsl";
  builder?: HyperliquidBuilder;
}
