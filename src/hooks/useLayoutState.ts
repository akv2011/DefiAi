import { useEffect, useState } from "react";

import { useAccount } from "wagmi";

import { useChat } from "@/contexts/chat-context";

export function useLayoutState() {
  const { isPublic, isReadOnly } = useChat();
  const { isConnected } = useAccount();
  const disconnectedDelay = 800;
  const inputDelay = 400;

  const isContentLoaded = typeof isPublic === "boolean";
  const canViewContent = isConnected || (isPublic === true && isReadOnly);

  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (isContentLoaded) {
      setIsFullyLoaded(true);
    }
  }, [isContentLoaded]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isFullyLoaded && !canViewContent) {
      timer = setTimeout(() => {
        setShowDisconnected(true);
      }, disconnectedDelay);
    } else {
      setShowDisconnected(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFullyLoaded, canViewContent, disconnectedDelay]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const showContent = isFullyLoaded && canViewContent;

    if (showContent && isConnected && !isReadOnly) {
      timer = setTimeout(() => {
        setShowInput(true);
      }, inputDelay);
    } else {
      setShowInput(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFullyLoaded, canViewContent, isConnected, isReadOnly]);

  return {
    isFullyLoaded,
    showDisconnected,
    showContent: isFullyLoaded && canViewContent,
    showInput,
  };
}
