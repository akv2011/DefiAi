"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Database, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

import { useMessageQuota } from "@/hooks/useMessageQuota";

interface ExampleQueriesProps {
  onSelect: (query: string) => void;
  activeMode?: "morpheus" | "sentinel";
  onModeSelect?: (mode: "morpheus" | "sentinel") => void;
}

export function ExampleQueries({
  onSelect,
  activeMode = "morpheus",
  onModeSelect,
}: ExampleQueriesProps) {
  const [currentMode, setCurrentMode] = useState<"morpheus" | "sentinel">(
    activeMode
  );
  const [activeMenu, setActiveMenu] = useState<"morpheus" | "sentinel" | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isQuotaExceeded } = useMessageQuota();

  useEffect(() => {
    setCurrentMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const queries = {
    morpheus: [
      "What is the sentiment around $BTC this week?",
      "What was the % correction since BTC hit ATH?",
      "Which perps trading platform has the deepest liquidity this week?",
      "What is the best bridge to use from Bitcoin to Ethereum?",
      "What are the largest $ETH holder addresses?",
      "Has the $ETH recently formed a bullish pattern on the weekly chart?",
    ],
    sentinel: [
      "What's in my Wallet?",
      "What open perps positions do I have?",
      "What lending markets are available for supplying USDC?",
      "Bridge 10% of my USDC on Base to Arbitrum.",
      "Borrow USDC against weETH on Morpho.",
      "Swap 1000 USDC for ETH on mainet.",
      "Open a 10x long position on $PEPE.",
    ],
  };

  const QueryItem = ({ query }: { query: string }) => {
    if (!query) return null;

    const handleClick = () => {
      if (isQuotaExceeded) return;

      if (activeMenu && onModeSelect && currentMode !== activeMenu) {
        onModeSelect(activeMenu);
      }
      onSelect(query);
      setActiveMenu(null);
    };

    return (
      <motion.button
        onClick={handleClick}
        className={`text-left px-3 py-2 text-sm rounded-md w-full transition-colors ${
          isQuotaExceeded
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer " +
              (activeMenu === "sentinel"
                ? "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
                : "hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10")
        }`}
        whileHover={isQuotaExceeded ? {} : { x: 4 }}
        whileTap={isQuotaExceeded ? {} : { scale: 0.98 }}
      >
        <div className="flex items-start">
          <span className="flex-1 whitespace-normal break-words mr-2">
            {query}
          </span>
          <ArrowRight
            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
              activeMenu === "morpheus"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-indigo-600 dark:text-indigo-400"
            }`}
          />
        </div>
      </motion.button>
    );
  };

  const handleMenuToggle = (mode: "morpheus" | "sentinel") => {
    setActiveMenu(activeMenu === mode ? null : mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full relative"
      ref={containerRef}
    >
      <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-2xl mx-auto">
        {/* Info Button */}
        <Dialog>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-0 rounded-xl w-[85vw] max-w-[500px] max-h-[85vh] overflow-auto">
            <div className="p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
                Matrix Terminal Modes
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                Choose how you want to interact with the Matrix
              </p>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <motion.div
                  className={`
                      rounded-lg cursor-pointer 
                      transition duration-200 p-2.5 sm:p-3
                      border backdrop-blur-sm
                      ${
                        currentMode === "morpheus"
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20"
                          : "border-gray-200 dark:border-gray-800 hover:border-emerald-300/50 dark:hover:border-emerald-700/50 bg-white/30 dark:bg-gray-900/30"
                      }
                    `}
                  onClick={() => {
                    if (onModeSelect && currentMode !== "morpheus") {
                      onModeSelect("morpheus");
                    }
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className={`p-1.5 sm:p-2 rounded-md mr-2 ${
                          currentMode === "morpheus"
                            ? "bg-emerald-100 dark:bg-emerald-900/60"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <BookOpen
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            currentMode === "morpheus"
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-medium text-sm sm:text-base ${
                          currentMode === "morpheus"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Morpheus Mode
                      </span>
                    </div>
                    <span className="text-xs bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 px-2 py-0.5 rounded uppercase font-medium">
                      Intelligence
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <p className="mb-1.5">
                      Access real-time market data and analytics
                    </p>
                    <ul className="space-y-0.5 pl-4 list-disc text-gray-600 dark:text-gray-400 text-xs">
                      <li>Live price data and market analysis</li>
                      <li>Social sentiment from Twitter and Telegram</li>
                      <li>Historical Trends and market shifts</li>
                      <li>Trading concepts and strategic positioning</li>
                    </ul>
                    <p className="mt-1.5 text-xs italic text-gray-500 dark:text-gray-500">
                      Example: &quot;What&apos;s the market sentiment for ETH
                      this week?&quot;
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className={`
                      rounded-lg cursor-pointer 
                      transition duration-200 p-2.5 sm:p-3
                      border backdrop-blur-sm
                      ${
                        currentMode === "sentinel"
                          ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/20"
                          : "border-gray-200 dark:border-gray-800 hover:border-indigo-300/50 dark:hover:border-indigo-700/50 bg-white/30 dark:bg-gray-900/30"
                      }
                    `}
                  onClick={() => {
                    if (onModeSelect && currentMode !== "sentinel") {
                      onModeSelect("sentinel");
                    }
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className={`p-1.5 sm:p-2 rounded-md mr-2 ${
                          currentMode === "sentinel"
                            ? "bg-indigo-100 dark:bg-indigo-900/60"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Database
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            currentMode === "sentinel"
                              ? "text-indigo-600 dark:text-indigo-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-medium text-sm sm:text-base ${
                          currentMode === "sentinel"
                            ? "bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-300 dark:to-blue-300 bg-clip-text text-transparent"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Sentinel Mode
                      </span>
                    </div>
                    <span className="text-xs bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded uppercase font-medium">
                      Commands
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <p className="mb-1.5"></p>
                    <ul className="space-y-0.5 pl-4 list-disc text-gray-600 dark:text-gray-400 text-xs">
                      <li>Swap and bridge across DEXs and networks</li>
                      <li>Open, close, manage positions in realtime</li>
                      <li>Set SL/TPs, manage risk effectively</li>
                      <li>Access LP and Vault strategies on Hyperliquid</li>
                    </ul>
                    <p className="mt-1.5 text-xs italic text-gray-500 dark:text-gray-500">
                      Example: &quot;Swap 0.5 ETH to USDC, open a long position
                      on PEPE&quot;
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Morpheus Button */}
        <motion.button
          className={`h-8 sm:h-9 rounded-xl px-3 sm:px-4 flex items-center gap-1.5 
            transition-all duration-200 border text-xs sm:text-sm
            bg-white/95 dark:bg-neutral-800 border-gray-300/70 dark:border-gray-700/30 text-gray-700 dark:text-gray-300
            ${activeMenu === "morpheus" ? "ring-2 ring-emerald-500/30 dark:ring-emerald-500/20" : ""}
            ${isQuotaExceeded ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
          onClick={() => !isQuotaExceeded && handleMenuToggle("morpheus")}
          whileHover={isQuotaExceeded ? {} : { scale: 1.02 }}
          whileTap={isQuotaExceeded ? {} : { scale: 0.98 }}
        >
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">Morpheus</span>
        </motion.button>

        {/* Sentinel Button */}
        <motion.button
          className={`h-8 sm:h-9 rounded-xl px-3 sm:px-4 flex items-center gap-1.5 
            transition-all duration-200 border text-xs sm:text-sm
            bg-white/95 dark:bg-neutral-800 border-gray-300/70 dark:border-gray-700/30 text-gray-700 dark:text-gray-300
            ${activeMenu === "sentinel" ? "ring-2 ring-indigo-500/30 dark:ring-indigo-500/20" : ""}
            ${isQuotaExceeded ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
          onClick={() => !isQuotaExceeded && handleMenuToggle("sentinel")}
          whileHover={isQuotaExceeded ? {} : { scale: 1.02 }}
          whileTap={isQuotaExceeded ? {} : { scale: 0.98 }}
        >
          <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium">Sentinel</span>
        </motion.button>
      </div>

      {/* Centered menu */}
      {activeMenu && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-50 top-[-16px] mt-2 w-auto"
          ref={menuRef}
        >
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-[30rem] max-w-[90vw] mx-auto p-3 rounded-xl shadow-lg border backdrop-blur-md",
              "bg-white/95 dark:bg-neutral-800",
              activeMenu === "morpheus"
                ? "border-emerald-300/70 dark:border-emerald-800/30"
                : "border-indigo-300/70 dark:border-indigo-800/30"
            )}
          >
            <div className="flex justify-between items-center mb-2 pl-3 pr-2">
              <h3
                className={cn(
                  "text-sm font-medium",
                  activeMenu === "morpheus"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-indigo-700 dark:text-indigo-300"
                )}
              >
                {activeMenu === "morpheus"
                  ? "Morpheus Intelligence"
                  : "Sentinel Commands"}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setActiveMenu(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {queries[activeMenu].map((query, idx) => (
                <QueryItem key={`${activeMenu}-${idx}`} query={query} />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
