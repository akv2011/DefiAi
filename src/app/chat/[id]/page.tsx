"use client";

import * as React from "react";

import { ChatLayout } from "@/components/chat/ChatLayout";

import { useChat } from "@/contexts/chat-context";

type PageParams = {
  params: Promise<{ id: string }>;
};

export default function ChatPage({ params }: PageParams) {
  const resolvedParams = React.use(params);
  const chatId = resolvedParams.id;
  const { initializeChat } = useChat();

  React.useEffect(() => {
    initializeChat(chatId);
  }, [chatId, initializeChat]);

  return <ChatLayout />;
}
