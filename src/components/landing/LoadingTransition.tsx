"use client";

import React, { useEffect, useState } from "react";

import { useAccount } from "wagmi";

import { BrandMark } from "@/components/shared/BrandMark";

const LoadingTransition: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isConnecting, isReconnecting } = useAccount();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isConnecting && !isReconnecting) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 300); // Shorter timeout since WalletGuard handles the auth state

      return () => clearTimeout(timer);
    }
  }, [isConnecting, isReconnecting]);

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out">
        <div className="relative w-60 h-60 animate-pulse flex items-center justify-center">
          <BrandMark size={120} className="text-emerald-400 opacity-50" />
        </div>
      </div>
    );
  }

  return children;
};

export default LoadingTransition;
