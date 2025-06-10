import React, { useEffect, useState } from "react";

import Image from "next/image";

import { isAddress } from "viem";

import { getChainImagePath } from "@/lib/chains";
import { resolveTokenSymbol, shortenAddress } from "@/lib/tokenService";

export function ToolHeaderInfo({
  args,
  toolName,
  className = "ml-2 text-xs text-gray-400 dark:text-gray-400",
}: {
  args: any;
  toolName: string;
  className?: string;
}) {
  const [fromTokenSymbol, setFromTokenSymbol] = useState<string>("");
  const [toTokenSymbol, setToTokenSymbol] = useState<string>("");

  useEffect(() => {
    if (toolName === "swap_or_bridge") {
      setFromTokenSymbol("");
      setToTokenSymbol("");

      const resolveTokens = async () => {
        if (args?.fromToken && isAddress(args.fromToken)) {
          try {
            const symbol = await resolveTokenSymbol(
              args.fromToken,
              args.fromChain
            );
            setFromTokenSymbol(symbol);
          } catch {
            setFromTokenSymbol(shortenAddress(args.fromToken));
          }
        } else if (args?.fromToken) {
          setFromTokenSymbol(args.fromToken);
        }

        if (args?.toToken && isAddress(args.toToken)) {
          try {
            const symbol = await resolveTokenSymbol(args.toToken, args.toChain);
            setToTokenSymbol(symbol);
          } catch {
            setToTokenSymbol(shortenAddress(args.toToken));
          }
        } else if (args?.toToken) {
          setToTokenSymbol(args.toToken);
        }
      };

      resolveTokens();
    }
  }, [args, toolName]);

  if (!args) return null;

  if (toolName === "NeoSearch" && args.searchQuery) {
    return (
      <span className={className}>
        <span className="mr-1">•</span> {args.searchQuery}
      </span>
    );
  }

  if (args.query) {
    return (
      <span className={className}>
        <span className="mr-1">•</span> {args.query}
      </span>
    );
  }

  if (args.wallet_address) {
    return (
      <span className={className}>
        <span className="mr-1">•</span> {shortenAddress(args.wallet_address)}
      </span>
    );
  }

  if (args.address) {
    return (
      <span className={className}>
        <span className="mr-1">•</span> {shortenAddress(args.address)}
      </span>
    );
  }

  if (toolName === "getSwapBridgeData" && (args.fromToken || args.toToken)) {
    const fromDisplay =
      fromTokenSymbol || (args.fromToken ? shortenAddress(args.fromToken) : "");
    const toDisplay =
      toTokenSymbol || (args.toToken ? shortenAddress(args.toToken) : "");

    return (
      <span className={`${className} flex items-center gap-1 flex-wrap`}>
        <span className="mr-1">•</span>
        {args.fromChain && (
          <Image
            src={getChainImagePath(args.fromChain)}
            alt={args.fromChain}
            width={16}
            height={16}
            className="inline-block rounded-full"
          />
        )}
        <span>
          {args.amount && <span>{args.amount}</span>} {fromDisplay}
        </span>
        {args.toToken && (
          <>
            <span>→</span>
            {args.toChain && (
              <Image
                src={getChainImagePath(args.toChain)}
                alt={args.toChain}
                width={16}
                height={16}
                className="inline-block rounded-full"
              />
            )}
            <span>{toDisplay}</span>
          </>
        )}
      </span>
    );
  }

  return (
    <>
      {args.tokenSymbol && (
        <span className={className}>
          <span className="mr-1">•</span> {args.tokenSymbol}
        </span>
      )}
      {args.token && (
        <span className={className}>
          <span className="mr-1">•</span> {args.token}
        </span>
      )}
      {args.chain && (
        <span className={className}>
          <span className="mr-1">•</span> {args.chain}
        </span>
      )}
      {args.fromToken && (
        <span className={className}>
          <span className="mr-1">•</span> {args.fromToken}
          {args.toToken ? ` → ${args.toToken}` : ""}
        </span>
      )}
      {args.symbol && (
        <span className={className}>
          <span className="mr-1">•</span> {args.symbol}
        </span>
      )}
      {args.asset && (
        <span className={className}>
          <span className="mr-1">•</span> {args.asset}
        </span>
      )}
      {args.spender && (
        <span className={className}>
          <span className="mr-1">•</span> {shortenAddress(args.spender)}
        </span>
      )}
    </>
  );
}
