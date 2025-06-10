"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useAccount } from "wagmi";

import { useChat } from "@/contexts/chat-context";

import BaseChatInput, { ChatMode } from "./chat-input-base";

interface RootChatInputProps {
  input?: string;
  onChange?: (value: string) => void;
  initialMode?: ChatMode;
  className?: string;
}

export default function RootChatInput({
  input = "",
  onChange,
  initialMode = "morpheus",
  className = "",
}: RootChatInputProps) {
  const {
    resetChat,
    chatId,
    setInitialMessage,
    handleMorpheusSearchSubmit,
    handleSubmit,
  } = useChat();
  const router = useRouter();
  const { address } = useAccount();

  const createNewChat = async () => {
    // Reset chat to generate a new chat ID
    resetChat();

    // Store the initial message in context for retrieval on the chat page
    setInitialMessage(input.trim(), initialMode as any);

    // Create an empty chat in the database first
    if (address) {
      try {
        const response = await fetch("/api/chats/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: chatId,
            wallet_address: address,
            messages: [], // Empty messages array initially
            label: "New Chat", // Default label
            prompt: input.trim(), // Use the initial message as the prompt
            response: "", // Empty response initially
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to create initial chat:", errorData);
        }
      } catch (error) {
        console.error("Error creating initial chat:", error);
      }
    }

    return chatId;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Create a new chat and navigate to it
      const chatId = await createNewChat();
      router.push(`/chat/${chatId}`);

      // Submit the message in the new chat
      if (initialMode === "morpheus") {
        await handleMorpheusSearchSubmit(input, "morpheus-search");
        onChange?.("");
      } else {
        handleSubmit(e);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  return (
    <BaseChatInput
      input={input}
      onChange={onChange}
      initialMode={initialMode}
      onSubmit={onSubmit}
      showReloadButton={false}
      className={className}
    />
  );
}
