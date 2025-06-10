import {
  ArrowRightLeft,
  BarChart4,
  CheckCircle2,
  CreditCard,
  Database,
  LineChart,
  PieChart,
  Wallet,
} from "lucide-react";

export const TOOL_INFO = {
  // from MCP server
  get_lending_positions: {
    label: "Lending Positions",
    description: "Aggregated lending positions with data",
    icon: PieChart,
  },
  get_token_info: {
    label: "Token Analytics",
    description: "Advanced token statistics and market data",
    icon: BarChart4,
  },
  get_token_balances: {
    label: "Token Balances",
    description: "Current wallet token holdings",
    icon: Wallet,
  },
  get_wallet_balance: {
    label: "Wallet Balance",
    description: "Current wallet status",
    icon: Wallet,
  },
  get_lending_markets: {
    label: "Lending Markets",
    description: "Aggregated lending markets with data",
    icon: LineChart,
  },
  get_yield_opportunities: {
    label: "Yield Opportunities",
    description: "Find high-yield investment opportunities",
    icon: LineChart,
  },
  generate_morpho_borrow_tx: {
    label: "Borrow from Morpho",
    description: "Borrow assets from Morpho protocol",
    icon: LineChart,
  },
  generate_morpho_vault_deposit_tx: {
    label: "Deposit to Morpho",
    description: "Deposit assets into Morpho vault",
    icon: LineChart,
  },
  generate_morpho_vault_withdraw_tx: {
    label: "Withdraw from Morpho",
    description: "Withdraw assets from Morpho vault",
    icon: LineChart,
  },
  generate_aave_supply_tx: {
    label: "Supply to Aave",
    description: "Supply assets to the Aave protocol",
    icon: LineChart,
  },
  generate_aave_borrow_tx: {
    label: "Borrow from Aave",
    description: "Borrow assets from the Aave protocol",
    icon: LineChart,
  },
  generate_aave_repay_tx: {
    label: "Repay Aave Loan",
    description: "Repay a loan from the Aave protocol",
    icon: LineChart,
  },
  generate_aave_withdraw_tx: {
    label: "Withdraw from Aave",
    description: "Withdraw assets from the Aave protocol",
    icon: LineChart,
  },
  generate_token_approval_tx: {
    label: "Token Approval",
    description: "Approve token spending",
    icon: CheckCircle2,
  },
  get_hyperliquid_positions: {
    label: "Hyperliquid Positions",
    description: "Get user's positions on Hyperliquid",
    icon: Wallet,
  },
  get_hyperliquid_open_orders: {
    label: "Hyperliquid Open Orders",
    description: "Get user's open orders on Hyperliquid",
    icon: Database,
  },

  // client tools
  getDesiredChain: {
    label: "Chain Selection",
    description: "Choose blockchain network",
    icon: Database,
  },
  getHyperliquidOpenPositions: {
    label: "Hyperliquid Open Positions",
    description: "Get user's open positions on Hyperliquid",
    icon: Wallet,
  },
  createPerpsOrder: {
    label: "Create Perps Order",
    description: "Create a perps order",
    icon: LineChart,
  },
  swap_or_bridge: {
    label: "Cross-Chain Token Swap",
    description: "Exchange between assets and/or chains",
    icon: ArrowRightLeft,
  },
  getAmount: {
    label: "Enter Amount",
    description: "Specify transaction amount",
    icon: CreditCard,
  },
  deposit_withdraw_hyperliquid: {
    label: "Deposit/Withdraw Hyperliquid",
    description: "Deposit or withdraw from Hyperliquid",
    icon: Wallet,
  },
} as const;

export const SIDEBAR_HIDDEN_TOOLS: string[] = [
  "NeoSearch",
  "getDesiredChain",
  "getAmount",
];

export const CHAT_HIDDEN_TOOLS: string[] = [];
