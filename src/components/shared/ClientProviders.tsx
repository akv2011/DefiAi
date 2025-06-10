"use client";

import { Suspense, lazy, useEffect, useState } from "react";

import LoadingTransition from "@/components/landing/LoadingTransition";
import { WalletGuard } from "@/components/shared/WalletGuard";
import { Web3Provider } from "@/components/shared/Web3Provider";

import { ChatProvider } from "@/contexts/chat-context";
import { MarketProvider } from "@/contexts/market-data";
import { SplitLayoutProvider } from "@/contexts/split-layout-context";
import { TabProvider } from "@/contexts/tab-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { UserProvider } from "@/contexts/user-context";

// Dynamically import the SubscriptionSuccessDialog component to avoid SSR issues
const SubscriptionSuccessDialog = lazy(
  () => import("@/components/subscription/SubscriptionSuccessDialog")
);

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // After mounting (hydration), we can render children
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider>
      <Web3Provider>
        <MarketProvider>
          <TabProvider>
            <SplitLayoutProvider>
              <ChatProvider>
                <UserProvider>
                  <WalletGuard>
                    <LoadingTransition>
                      {/* Subscription success dialog with client-side only rendering */}
                      {mounted && typeof window !== "undefined" && (
                        <Suspense fallback={null}>
                          <SubscriptionSuccessDialog />
                        </Suspense>
                      )}
                      {children}
                    </LoadingTransition>
                  </WalletGuard>
                </UserProvider>
              </ChatProvider>
            </SplitLayoutProvider>
          </TabProvider>
        </MarketProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}
