"use client";

import { useCallback, useEffect, useState } from "react";

import { useAccount } from "wagmi";

import { supabaseReadOnly } from "@/lib/supabaseClient";
import { UserQuota, getUserQuota } from "@/lib/userManager";

import { useChat } from "@/contexts/chat-context";

export function useMessageQuota() {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const { address, isConnected } = useAccount();
  const { messages, isLoading } = useChat();

  const fetchQuota = useCallback(async () => {
    setLoading(true);

    if (!address || !isConnected) {
      setIsQuotaExceeded(false);
      setLoading(false);
      return;
    }

    try {
      const userQuota = await getUserQuota(supabaseReadOnly, address);
      setQuota(userQuota);
      setIsQuotaExceeded(userQuota.remaining <= 0);
    } catch (error) {
      console.error("Error fetching message quota:", error);
      setIsQuotaExceeded(false);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    if (!isLoading) {
      fetchQuota();
    }
  }, [messages.length, isLoading, fetchQuota]);

  return {
    quota,
    loading,
    isQuotaExceeded,
    fetchQuota,
  };
}
