"use client";

import * as React from "react";

import { useAccount } from "wagmi";

import { RootLayout } from "@/components/chat/RootLayout";
import { DisconnectedCard } from "@/components/shared/DisconnectedCard";
import MatrixCanvas from "@/components/shared/MatrixCanvas";

import { useChat } from "@/contexts/chat-context";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { handleNavigateToRoot } = useChat();

  React.useEffect(() => {
    handleNavigateToRoot();
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0"></div>

      {!isConnected && (
        <>
          <MatrixCanvas />
          <DisconnectedCard />
        </>
      )}

      {isConnected && <RootLayout />}
    </>
  );
}
