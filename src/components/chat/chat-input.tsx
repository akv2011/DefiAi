"use client";

import React from "react";

import { AlertCircle } from "lucide-react";

import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";

import { useToast } from "@/hooks/use-toast";
import { useMessageQuota } from "@/hooks/useMessageQuota";

import { useChat } from "@/contexts/chat-context";

import BaseChatInput, { ChatMode } from "./chat-input-base";

interface ChatInputProps {
  input?: string;
  onChange?: (value: string) => void;
  onReload?: () => void;
  initialMode?: ChatMode;
  onSubmitMessage?: () => void;
  className?: string;
}

export default function ChatInput({
  input = "",
  onChange,
  onReload,
  initialMode = "morpheus",
  onSubmitMessage,
  className = "",
}: ChatInputProps) {
  const {
    handleSubmit,
    handleMorpheusSearchSubmit,
    isPendingResponse,
    isReadOnly,
    hasPendingTools,
  } = useChat();
  const { isQuotaExceeded, loading: isQuotaLoading } = useMessageQuota();
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (hasPendingTools) {
      toast({
        title: "Action in progress",
        description:
          "Please complete the pending action before sending a new message.",
        variant: "destructive",
      });
      return;
    }

    if (initialMode === "morpheus") {
      await handleMorpheusSearchSubmit(input, "morpheus-search");
      onChange?.("");
    } else {
      handleSubmit(e);
    }
  };

  if (isReadOnly) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 backdrop-blur-sm bg-white/50 dark:bg-black/50">
        <AlertCircle className="h-4 w-4" />
        <span>
          This is a published chat. You can view it but cannot modify or respond
          to it.
        </span>
      </div>
    );
  }

  const showQuotaExceededMessage = isQuotaExceeded && !isQuotaLoading;

  return (
    <>
      {showQuotaExceededMessage && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex flex-col items-center justify-center gap-3 text-sm backdrop-blur-sm bg-white/50 dark:bg-black/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span>
              You&apos;ve reached your daily message limit. Upgrade to premium
              for unlimited messages.
            </span>
          </div>
          <div>
            <SubscriptionDialog
              buttonText="Upgrade to Premium"
              showIcon={true}
              buttonVariant="default"
              buttonClassName="bg-gradient-to-br from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
              source="message_limit_reached"
            />
          </div>
        </div>
      )}
      <BaseChatInput
        input={input}
        onChange={onChange}
        onReload={onReload}
        initialMode={initialMode}
        onSubmitMessage={onSubmitMessage}
        onSubmit={onSubmit}
        showReloadButton={!isPendingResponse}
        className={className}
      />
    </>
  );
}
