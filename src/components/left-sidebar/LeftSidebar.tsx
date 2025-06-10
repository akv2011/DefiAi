import React, { useRef } from "react";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { SupabaseClient } from "@supabase/supabase-js";
import { ConnectKitButton } from "connectkit";
import {
  Github,
  MessageCircle,
  PanelLeftClose,
  PlusCircle,
  Settings,
} from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";

import { supabaseReadOnly } from "@/lib/supabaseClient";

import { useChat } from "@/contexts/chat-context";

import { SavedMessage } from "@/types/chat";

import { useSplitLayout } from "../../contexts/split-layout-context";
import TierAccess from "../chat/TierAccess";
import XIcon from "../shared/XIcon";
import { ChatGroup } from "./ChatGroup";

// Also log the source to make sure we're using the correct one
console.log("Using split layout from: ../../contexts/split-layout-context");

interface GroupedMessages {
  today: SavedMessage[];
  yesterday: SavedMessage[];
  lastWeek: SavedMessage[];
  older: SavedMessage[];
}

const groupMessagesByDate = (messages: SavedMessage[]): GroupedMessages => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  return messages.reduce(
    (groups, message) => {
      const messageDate = new Date(message.created_at);

      if (messageDate >= today) {
        groups.today.push(message);
      } else if (messageDate >= yesterday) {
        groups.yesterday.push(message);
      } else if (messageDate >= lastWeek) {
        groups.lastWeek.push(message);
      } else {
        groups.older.push(message);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: [],
    } as GroupedMessages
  );
};

export function SavedMessagesSidebar() {
  const [savedMessages, setSavedMessages] = React.useState<SavedMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { address } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const { resetChat } = useChat();
  const { toggleLeftSidebar, closeRightSidebar } = useSplitLayout();

  // Ref for the sidebar container element
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Mouse leave auto-close functionality has been removed

  const currentChatId = React.useMemo(() => {
    const match = pathname.match(/\/chat\/(.+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const fetchSavedMessages = React.useCallback(async () => {
    if (!address) return;
    try {
      setIsLoading(true);

      // Only fetch chats that the user owns (either private or public)
      const { data, error } = await supabaseReadOnly
        .from("saved_chats")
        .select("*")
        .eq("wallet_address", address)
        .order("is_favorite", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;
      setSavedMessages(data || []);

      const nonNullSupabase = supabaseReadOnly as SupabaseClient;
      const subscription = nonNullSupabase
        .channel("saved_chats_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "saved_chats",
            filter: `wallet_address=eq.${address}`,
          },
          payload => {
            console.log("Change received!", payload);
            fetchSavedMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error fetching saved messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  React.useEffect(() => {
    if (address) {
      fetchSavedMessages();
    }
  }, [address, fetchSavedMessages]);

  const handleMessageClick = (messageId: string) => {
    if (pathname === `/chat/${messageId}`) return;

    closeRightSidebar();
    toggleLeftSidebar();

    router.push(`/chat/${messageId}`);
  };

  const handleNewChat = () => {
    // Create a completely fresh chat
    resetChat();

    // Close both right and left sidebars
    closeRightSidebar();
    toggleLeftSidebar(); // This will close the left sidebar

    // Navigate to root
    router.push(`/`);
  };

  const groupedMessages = React.useMemo(
    () => groupMessagesByDate(savedMessages),
    [savedMessages]
  );

  return (
    <div
      ref={sidebarRef}
      data-testid="sidebar-container"
      className="bg-white dark:bg-neutral-900 border-r border-gray-200/60 dark:border-gray-800/40 transition-all duration-300 flex flex-col h-full"
    >
      {/* Header - Fixed */}
      <div className="flex-none px-4 pt-2 flex justify-between">
        <Image
          src="/logo/icon_white.svg"
          alt="Logo"
          width={24}
          height={20}
          className="cursor-pointer invert dark:filter-none"
          onClick={handleNewChat}
        />
        <Button
          variant="ghost"
          className="cursor-pointer p-0 hover:!bg-transparent"
          onClick={toggleLeftSidebar}
          aria-label="Close sidebar"
          id="sidebar-close-button"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button - Fixed */}
      <div className="flex-none p-4">
        <Button
          variant="default"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-primary dark:hover:bg-primary/70 cursor-pointer dark:text-black"
          onClick={handleNewChat}
          data-testid="new-chat-button"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          {isLoading ? (
            <div
              className="text-sm text-gray-500 text-center py-4"
              data-testid="loading-messages"
            >
              Loading...
            </div>
          ) : savedMessages.length > 0 ? (
            <>
              <ChatGroup
                title="Today"
                messages={groupedMessages.today}
                currentChatId={currentChatId}
                onMessageClick={handleMessageClick}
                onDeleteSuccess={() => fetchSavedMessages()}
              />
              <ChatGroup
                title="Yesterday"
                messages={groupedMessages.yesterday}
                currentChatId={currentChatId}
                onMessageClick={handleMessageClick}
                onDeleteSuccess={() => fetchSavedMessages()}
              />
              <ChatGroup
                title="Last 7 days"
                messages={groupedMessages.lastWeek}
                currentChatId={currentChatId}
                onMessageClick={handleMessageClick}
                onDeleteSuccess={() => fetchSavedMessages()}
              />
              <ChatGroup
                title="Older"
                messages={groupedMessages.older}
                currentChatId={currentChatId}
                onMessageClick={handleMessageClick}
                onDeleteSuccess={() => fetchSavedMessages()}
              />
            </>
          ) : (
            <div
              className="text-sm text-gray-500 text-center py-4"
              data-testid="no-saved-messages"
            >
              No saved messages
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-none border-t border-gray-200/60 dark:border-gray-800/40">
        <TierAccess className="py-1" />

        {/* Wallet & Settings Section - Only visible on mobile */}
        <div className="md:hidden border-t border-gray-200/60 dark:border-gray-800/40 p-2">
          <div className="flex justify-between items-center">
            <div className="flex-1 pr-2">
              <ConnectKitButton.Custom>
                {({ isConnected, isConnecting, show, address, ensName }) => {
                  return (
                    <Button
                      onClick={show}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 flex items-center gap-2"
                    >
                      {isConnected ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          {ensName ||
                            (address
                              ? address.substring(0, 6) +
                                "..." +
                                address.substring(address.length - 4)
                              : "Connect")}
                        </>
                      ) : isConnecting ? (
                        "Connecting..."
                      ) : (
                        "Connect Wallet"
                      )}
                    </Button>
                  );
                }}
              </ConnectKitButton.Custom>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-[32px] rounded-full"
              onClick={() => {
                closeRightSidebar();
                router.push("/profile");
              }}
            >
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors" />
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200/60 dark:border-gray-800/40 py-3">
          <div className="flex justify-center space-x-6 gap-4">
            <a
              href="https://x.com/thematrixapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/the_matrix_official_portal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/MatrixTerminal/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
