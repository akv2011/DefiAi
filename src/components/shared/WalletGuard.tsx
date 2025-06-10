"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useAccount } from "wagmi";

import { useTheme } from "@/contexts/theme-context";

const isPublicPath = (path: string) =>
  path === "/" || path.startsWith("/chat/");

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { isConnecting, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isConnecting && !isInitialized) {
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnecting, isInitialized]);

  useEffect(() => {
    if (
      isInitialized &&
      !isConnecting &&
      !isConnected &&
      !isPublicPath(pathname)
    ) {
      router.push("/");
    }

    if (isConnected) {
      const savedTheme = localStorage.getItem("theme") || "dark";
      setTheme(savedTheme === "dark" ? "dark" : "light");
    }
  }, [isConnected, isConnecting, pathname, router, isInitialized, setTheme]);

  if (!isInitialized || isConnecting) {
    return <>{children}</>;
  }

  if (!isConnected && !isPublicPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
