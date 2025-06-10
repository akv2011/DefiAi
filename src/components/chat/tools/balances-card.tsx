import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { chainIdToName } from "@/lib/chains";
import { cn, getModeStyling } from "@/lib/utils";

import { useMediaQuery } from "@/hooks/useMediaQuery";

import { useChat } from "@/contexts/chat-context";

interface TokenBalance {
  chain: string;
  chainId: number;
  token: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
  };
  balance: string;
  balanceRaw: string;
  balanceUSD?: string;
}

interface BalancesCardProps {
  balances: TokenBalance[];
  messageMode?: string;
}

export function BalancesCard({ balances, messageMode }: BalancesCardProps) {
  const { activeMode } = useChat();
  const mode = messageMode || activeMode;
  const styles = getModeStyling(mode);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const formatUSD = (usdValue?: string) => {
    if (!usdValue) return "0.00";
    try {
      return Number(usdValue).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (e) {
      console.error("Error formatting USD:", usdValue, e);
      return "0.00";
    }
  };

  // Sort balances by USD value (highest first)
  const sortedBalances = (balances ?? []).sort((a, b) => {
    const aValue = Number(a.balanceUSD || 0);
    const bValue = Number(b.balanceUSD || 0);
    return bValue - aValue; // Sort descending by USD value
  });

  // Also apply safe access for calculating totalValue
  const totalValue = (balances ?? []).reduce((acc, balance) => {
    const value = Number(balance.balanceUSD || 0);
    if (isNaN(value)) return acc;
    return acc + value;
  }, 0);

  if (!balances || sortedBalances.length === 0) {
    return (
      <Card className={cn("rounded-lg overflow-hidden shadow", styles.border)}>
        <CardHeader
          className={cn("px-3 py-2 border-b", styles.background, styles.border)}
        >
          <CardTitle className={cn("text-sm font-medium", styles.highlight)}>
            Token Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {balances === undefined
            ? "Loading balances..."
            : "No balances found."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-white dark:bg-black rounded-lg overflow-hidden shadow",
        styles.border
      )}
    >
      <CardHeader
        className={cn(
          "px-3 py-2 flex flex-row items-center justify-between border-b",
          styles.background,
          styles.border
        )}
      >
        <CardTitle
          className={cn(
            "text-sm font-medium flex items-center gap-1.5",
            styles.highlight
          )}
        >
          <svg
            className={cn("w-4 h-4", styles.text)}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          Token Balances
        </CardTitle>
        <div className={cn("text-base font-bold", styles.highlight)}>
          ${formatUSD(totalValue.toString())}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-hidden">
          {/* Header Row */}
          <div
            className={cn(
              "grid grid-cols-12 gap-1 py-2 px-3 border-b text-xs font-medium",
              mode === "sentinel"
                ? "bg-teal-100/30 dark:bg-teal-900/30"
                : "bg-emerald-100/30 dark:bg-emerald-900/30",
              styles.border,
              styles.muted
            )}
          >
            {isMobile ? (
              <>
                <div className="col-span-8">ASSET / AMOUNT</div>
                <div className="col-span-4 text-right">VALUE</div>
              </>
            ) : (
              <>
                <div className="col-span-6">TOKEN</div>
                <div className="col-span-3 text-right">AMOUNT</div>
                <div className="col-span-3 text-right">VALUE</div>
              </>
            )}
          </div>

          {/* Token Rows */}
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
            {sortedBalances.map(balance => (
              <div
                key={`${balance.chainId}-${balance.token.address}`}
                className={cn(
                  "grid grid-cols-12 gap-1 py-2 px-3 border-b transition-colors",
                  mode === "sentinel"
                    ? "border-teal-100 dark:border-teal-900/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/30"
                    : "border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30"
                )}
              >
                {isMobile ? (
                  <>
                    {/* Mobile: ASSET / AMOUNT */}
                    <div className="col-span-8 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            mode === "sentinel"
                              ? "text-teal-900 dark:text-teal-100"
                              : "text-emerald-900 dark:text-emerald-100"
                          )}
                        >
                          {balance.token.symbol}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-1 py-0.5 rounded text-[10px] text-black dark:text-white",
                            mode === "sentinel"
                              ? "bg-teal-100/50 dark:bg-teal-800/50"
                              : "bg-emerald-100/50 dark:bg-emerald-800/50"
                          )}
                        >
                          {chainIdToName[balance.chainId]?.slice(0, 3) ||
                            `C${balance.chainId}`}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "text-xs font-mono mt-0.5",
                          mode === "sentinel"
                            ? "text-teal-700 dark:text-teal-300"
                            : "text-emerald-700 dark:text-emerald-300"
                        )}
                      >
                        {balance.balance}
                      </div>
                    </div>

                    {/* Mobile: VALUE */}
                    <div className="col-span-4 flex items-center justify-end">
                      <div
                        className={cn(
                          "text-xs text-right font-medium",
                          mode === "sentinel"
                            ? "text-teal-900 dark:text-teal-50"
                            : "text-emerald-900 dark:text-emerald-50"
                        )}
                      >
                        ${formatUSD(balance.balanceUSD)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Desktop: TOKEN */}
                    <div className="col-span-6 flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              mode === "sentinel"
                                ? "text-teal-900 dark:text-teal-100"
                                : "text-emerald-900 dark:text-emerald-100"
                            )}
                          >
                            {balance.token.symbol}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] truncate max-w-[100px]",
                              mode === "sentinel"
                                ? "text-teal-500 dark:text-teal-400"
                                : "text-emerald-500 dark:text-emerald-400"
                            )}
                            title={balance.token.name}
                          >
                            {balance.token.name}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded text-black dark:text-white",
                          mode === "sentinel"
                            ? "bg-teal-100/50 dark:bg-teal-800/50"
                            : "bg-emerald-100/50 dark:bg-emerald-800/50"
                        )}
                      >
                        {chainIdToName[balance.chainId] ||
                          `Chain ${balance.chainId}`}
                      </span>
                    </div>

                    {/* Desktop: AMOUNT */}
                    <div className="col-span-3 flex items-center justify-end">
                      <div
                        className={cn(
                          "text-xs text-right font-mono",
                          mode === "sentinel"
                            ? "text-teal-700 dark:text-teal-300"
                            : "text-emerald-700 dark:text-emerald-300"
                        )}
                      >
                        {balance.balance}
                      </div>
                    </div>

                    {/* Desktop: VALUE */}
                    <div className="col-span-3 flex items-center justify-end">
                      <div
                        className={cn(
                          "text-xs text-right font-medium",
                          mode === "sentinel"
                            ? "text-teal-900 dark:text-teal-50"
                            : "text-emerald-900 dark:text-emerald-50"
                        )}
                      >
                        ${formatUSD(balance.balanceUSD)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
