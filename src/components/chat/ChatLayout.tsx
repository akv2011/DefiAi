"use client";

import * as React from "react";

import { usePathname } from "next/navigation";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import ChatInput from "@/components/chat/chat-input";
import { Messages } from "@/components/chat/messages";
import { ChatDisconnectedCard } from "@/components/shared/DisconnectedCard";

import { useLayoutState } from "@/hooks/useLayoutState";

import { useChat } from "@/contexts/chat-context";

import ChatNotFound from "./ChatNotFound";

const ChatTransitionOverlay = () => {
  const { activeMode } = useChat();

  const loaderColor =
    activeMode === "sentinel"
      ? "text-indigo-500 dark:text-indigo-400"
      : "text-emerald-500 dark:text-emerald-400";

  return (
    <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/50 backdrop-blur-md flex items-center justify-center">
      <Loader2
        className={`w-12 h-12 animate-spin ${loaderColor}`}
        strokeWidth={1.5}
      />
    </div>
  );
};

export function ChatLayout() {
  const pathname = usePathname();
  const {
    input,
    handleInputChange,
    reload,
    activeMode,
    chatTitle,
    chatNotFound,
    isTransitioningChats,
  } = useChat();

  // Add state to track the input container height
  const inputRef = React.useRef<HTMLDivElement>(null);

  const { showDisconnected, showContent, showInput } = useLayoutState();

  return (
    <div className="h-screen flex w-full absolute inset-0 bg-transparent">
      <div className="flex-1 z-0 relative w-full">
        <div className="flex-1 min-w-0 w-full h-full">
          {/* Chat title on mobile */}
          {pathname.includes("/chat") && (
            <div className="md:hidden absolute top-[55px] left-0 right-0 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800/50 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
              <div className="text-center truncate font-medium">
                {chatTitle || "New Chat"}
              </div>
            </div>
          )}
          <div className="flex flex-col h-screen w-full">
            {showDisconnected && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                  <ChatDisconnectedCard />
                </div>
              </div>
            )}
            {isTransitioningChats && <ChatTransitionOverlay />}

            {showContent && (
              <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {chatNotFound ? (
                  <ChatNotFound />
                ) : (
                  <>
                    <Messages />
                    <div className="mx-auto max-w-3xl absolute bottom-0 left-0 right-0 h-2 bg-gray-100 dark:bg-neutral-900 px-[2px] sm:px-0"></div>
                    {showInput && (
                      <motion.div
                        ref={inputRef}
                        initial={{
                          y: "100%",
                        }}
                        animate={{
                          y: 0,
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeOut",
                        }}
                        className="absolute bottom-0 left-0 right-0 px-2 sm:px-4 pb-2 z-20"
                      >
                        <ChatInput
                          input={input}
                          onChange={handleInputChange}
                          onReload={reload}
                          initialMode={activeMode}
                          onSubmitMessage={() => {
                            window.dispatchEvent(new Event("chat:generating"));
                          }}
                        />
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
