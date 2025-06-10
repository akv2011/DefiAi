import React from "react";

import { SavedMessage } from "@/types/chat";

import { MessageItem } from "./ChatItem";

interface MessageGroupProps {
  title: string;
  messages: SavedMessage[];
  currentChatId: string | null;
  onMessageClick: (id: string) => void;
  onDeleteSuccess: () => void;
}

export function ChatGroup({
  title,
  messages,
  currentChatId,
  onMessageClick,
  onDeleteSuccess,
}: MessageGroupProps) {
  if (messages.length === 0) return null;

  return (
    <div className="mb-4 w-full">
      <h2 className="mb-2 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-0.5 w-full">
        {messages.map(message => (
          <MessageItem
            key={message.id}
            message={message}
            isSelected={message.id === currentChatId}
            onClick={() => onMessageClick(message.id)}
            onDeleteSuccess={onDeleteSuccess}
          />
        ))}
      </div>
    </div>
  );
}
