"use client";

import * as React from "react";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";

import RootChatInput from "@/components/chat/chat-input-root";
import { ExampleQueries } from "@/components/chat/example-queries";
import { ChatDisconnectedCard } from "@/components/shared/DisconnectedCard";

import { useChat } from "@/contexts/chat-context";

export function RootLayout() {
  const { isConnected } = useAccount();
  const { input, handleInputChange, activeMode, setActiveMode } = useChat();

  // Handler for example query selection
  const handleExampleSelect = (query: string) => {
    // Check if this is a special query with mode information (format: "query|||mode")
    const parts = query.split("|||");
    const actualQuery = parts[0];
    const modeOverride =
      parts.length > 1 ? (parts[1] as "morpheus" | "sentinel") : undefined;

    // Update the mode if provided in the query
    if (modeOverride) {
      setActiveMode(modeOverride);
    }

    // RootChatInput handles double-click detection and redirect
    handleInputChange(actualQuery);
  };

  const modeTitle =
    activeMode === "morpheus"
      ? "What intelligence do you need?"
      : "What do you want to do on chain?";

  const modeTitleStyles =
    activeMode === "morpheus"
      ? "text-emerald-800 dark:text-emerald-50 font-light"
      : "text-indigo-800 dark:text-indigo-50 font-light";

  if (!isConnected) {
    return (
      <div className="h-screen flex w-full absolute inset-0 bg-transparent">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ChatDisconnectedCard />
          </div>
        </div>
      </div>
    );
  }

  // Main connected layout
  return (
    <div className="h-screen flex w-full absolute inset-0 bg-transparent">
      <div className="flex-1 z-0 relative w-full">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="mx-auto mt-4 w-full flex-1 px-4 md:pl-8 lg:mt-6 max-w-7xl !mt-0 flex flex-col items-center gap-4 pt-12 md:pr-14 2xl:pr-20 pt-[10vh] md:pt-[30vh] max-sm:!px-1"
        >
          {/* Dynamic title */}
          <motion.h1
            key={activeMode}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.35,
              ease: "easeOut",
            }}
            className={`text-2xl lg:text-5xl ${modeTitleStyles} drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] mb-7 text-center`}
          >
            {modeTitle}
          </motion.h1>

          {/* Chat input */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.4,
              duration: 0.6,
              ease: "easeOut",
            }}
            className="w-full max-w-2xl"
          >
            <RootChatInput
              input={input}
              onChange={handleInputChange}
              initialMode={activeMode}
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.6,
              duration: 0.6,
              ease: "easeOut",
            }}
            className="w-full"
          >
            <ExampleQueries
              onSelect={handleExampleSelect}
              activeMode={activeMode}
              onModeSelect={setActiveMode}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
