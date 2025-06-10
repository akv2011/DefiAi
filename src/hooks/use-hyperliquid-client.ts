import { useCallback, useEffect, useState } from "react";

import * as hl from "@nktkas/hyperliquid";
import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { useSwitchChain, useWalletClient } from "wagmi";

interface MarketInfo {
  name: string;
  index: number;
  szDecimals: number;
}

interface HyperliquidClientState {
  publicClient: hl.PublicClient | null;
  walletClientHL: hl.WalletClient | null;
  markets: MarketInfo[];
  isLoading: boolean;
  error: string | null;
  approveAgentIfNeeded: () => Promise<hl.WalletClient>;
  getMarketIndex: (assetName: string) => number | undefined;
}

export function useHyperliquidClient(): Omit<
  HyperliquidClientState,
  "agentAddress"
> {
  const [publicClient, setPublicClient] = useState<hl.PublicClient | null>(
    null
  );
  const [walletClientHL, setWalletClientHL] = useState<hl.WalletClient | null>(
    null
  );
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: viemWalletClient } = useWalletClient(); // Get the viem WalletClient
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    let isMounted = true;
    const initializeClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const transport = new hl.HttpTransport();
        const newPublicClient = new hl.PublicClient({ transport });
        setPublicClient(newPublicClient);

        // Fetch markets early
        const meta = await newPublicClient.meta();
        const marketList = (meta.universe as any[]).map((market, index) => ({
          name: market.name,
          index,
          szDecimals: market.szDecimals || 0,
        }));
        if (isMounted) {
          setMarkets(marketList);
        }

        if (viemWalletClient) {
          const newWalletClientHL = new hl.WalletClient({
            wallet: viemWalletClient,
            transport,
          });
          if (isMounted) setWalletClientHL(newWalletClientHL);
        } else {
          if (isMounted) {
            setWalletClientHL(null);
          }
        }
      } catch (err) {
        console.error("Failed to initialize Hyperliquid clients:", err);
        if (isMounted)
          setError(
            err instanceof Error ? err.message : "Initialization failed"
          );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeClients();

    return () => {
      isMounted = false;
      // Potentially close transport if needed, though HttpTransport might not require explicit closing
    };
  }, [viemWalletClient]); // Depend on viemWalletClient

  const approveAgentIfNeeded =
    useCallback(async (): Promise<hl.WalletClient> => {
      if (!viemWalletClient || !walletClientHL || !switchChainAsync) {
        throw new Error("Wallet not connected or clients not initialized.");
      }
      // Ensure correct chain
      await switchChainAsync({ chainId: arbitrum.id });

      // Create a new agent on demand
      const agentPk = generatePrivateKey();
      const agentAcc = privateKeyToAccount(agentPk);
      const newAgentAddress = agentAcc.address;

      // Create viem wallet client for the agent
      const agentViemWc = createWalletClient({
        account: agentAcc,
        chain: arbitrum,
        transport: http(),
      });

      // Create Hyperliquid wallet client for the agent
      const newAgentWalletClient = new hl.WalletClient({
        wallet: agentViemWc,
        transport: new hl.HttpTransport(), // Use a dedicated transport
      });

      console.log(
        `Approving new agent ${newAgentAddress} for user ${viemWalletClient.account?.address}`
      );
      try {
        await walletClientHL.approveAgent({
          agentAddress: newAgentAddress,
          agentName: "Matrix",
        });
        console.log("New agent approved successfully.");
        // Return the newly created and approved agent client
        return newAgentWalletClient;
      } catch (approvalError) {
        console.error("Failed to approve agent:", approvalError);
        throw new Error(
          `Failed to approve agent: ${
            approvalError instanceof Error
              ? approvalError.message
              : String(approvalError)
          }`
        );
      }
    }, [walletClientHL, switchChainAsync, viemWalletClient]);

  const getMarketIndex = useCallback(
    (assetName: string): number | undefined => {
      const market = markets.find(m => m.name === assetName);
      return market?.index;
    },
    [markets]
  );

  return {
    publicClient,
    walletClientHL,
    markets,
    isLoading,
    error,
    approveAgentIfNeeded,
    getMarketIndex,
  };
}
