"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { arbitrum, base, mainnet, optimism } from "wagmi/chains";

import { useTheme } from "@/contexts/theme-context";

// Define custom chains that aren't in wagmi directly
const mode = {
  id: 34443,
  name: "Mode",
  network: "mode",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.mode.network"],
    },
    public: {
      http: ["https://mainnet.mode.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mode Explorer",
      url: "https://explorer.mode.network",
    },
  },
} as const;

// Create a custom chain for Sonic
const sonic = {
  id: 2520,
  name: "Sonic",
  network: "sonic",
  nativeCurrency: {
    name: "Sonic",
    symbol: "SONIC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sonic.org"],
    },
    public: {
      http: ["https://rpc.sonic.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Sonic Explorer",
      url: "https://explorer.sonic.org",
    },
  },
} as const;

// Your WalletConnect Project ID
const walletConnectProjectId = "09a66514abcd02229ffa6268fe5d2146";

// Create ConnectKit config
const config = createConfig(
  getDefaultConfig({
    // All supported chains
    chains: [mainnet, base, mode as any, arbitrum, optimism, sonic as any],
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [mode.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [sonic.id]: http(),
    },

    // Required WalletConnect ID
    walletConnectProjectId,

    // Application information
    appName: "The Matrix",
    appDescription: "Matrix Terminal",
    appUrl: "https://thematrix.app",
    appIcon: "https://thematrix.app/logo.png",
  })
);

// Create query client
const queryClient = new QueryClient();

// Web3 Provider component
export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme={isDarkMode ? "midnight" : "auto"}
          mode={isDarkMode ? "dark" : "light"}
          customTheme={{
            // Common colors that remain the same in both modes
            "--ck-connectbutton-color": "#000000",
            "--ck-connectbutton-background": "#47D8A3",
            "--ck-connectbutton-hover-background": "#3bb990",
            "--ck-primary-button-background": "#47D8A3",
            "--ck-primary-button-hover-background": "#3bb990",
            "--ck-primary-button-color": "#000000",

            // Theme-specific colors
            "--ck-body-background": isDarkMode ? "#000000" : "#ffffff",
            "--ck-body-color": isDarkMode ? "#ffffff" : "#111111",
            "--ck-body-color-muted": isDarkMode ? "#aaaaaa" : "#666666",
            "--ck-secondary-button-background": isDarkMode
              ? "#222222"
              : "#f0f0f0",
            "--ck-secondary-button-color": isDarkMode ? "#ffffff" : "#111111",
            "--ck-overlay-background": isDarkMode
              ? "rgba(0, 0, 0, 0.8)"
              : "rgba(0, 0, 0, 0.4)",
            "--ck-focus-color": "#47D8A3",
            "--ck-border-color": isDarkMode ? "#333333" : "#e0e0e0",

            // Badge styling for "Recent" tag
            "--ck-recent-badge-background": isDarkMode ? "#000000" : "#ffffff",
            "--ck-recent-badge-color": isDarkMode ? "#47D8A3" : "#118860",
            "--ck-recent-badge-border": "none",
            "--ck-recent-badge-box-shadow": "none",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
