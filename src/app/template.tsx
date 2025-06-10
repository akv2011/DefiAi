"use client";

import * as React from "react";

import { Header } from "@/components/header/header";
import { SplitLayout } from "@/components/layout/split-layout";

export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChatActive, setIsChatActive] = React.useState(false);

  // Listen for chat activity
  React.useEffect(() => {
    const handleChatStart = () => setIsChatActive(true);

    // Event listener for when chat starts generating
    window.addEventListener("chat:generating", handleChatStart);

    return () => {
      window.removeEventListener("chat:generating", handleChatStart);
    };
  }, []);

  return (
    <div className="h-screen flex overflow-hidden w-full">
      <SplitLayout>
        <div
          className={`relative flex flex-col w-full h-full ${!isChatActive ? "header-transparent" : ""}`}
        >
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            {children}
          </div>
        </div>
      </SplitLayout>
    </div>
  );
}
