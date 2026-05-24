import React, { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

const loadingMessages = [
  "Accessing the divine knowledge base...",
  "Channeling cosmic wisdom...",
  "Consulting with digital oracles...",
  "Analyzing DeFi opportunities...",
  "Synchronizing with universal datasets...",
  "Materializing optimal solutions...",
  "Analyzing quantum probabilities...",
  "Interfacing with higher dimensions...",
  "Processing ethereal algorithms...",
  "Harmonizing data streams...",
];

const progressMessages = [
  "Calibrating neural pathways...",
  "Enhancing data resolution...",
  "Refining quantum accuracy...",
  "Optimizing response vectors...",
  "Amplifying signal clarity...",
  "Focusing dimensional lens...",
  "Maximizing insight potential...",
  "Stabilizing market data...",
  "Perfecting output quality...",
  "Fine-tuning cosmic frequencies...",
];

export const EnhancedLoading = ({ mode }: { mode?: string }) => {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [currentProgress, setCurrentProgress] = useState(progressMessages[0]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 3000);

    const progressInterval = setInterval(() => {
      setCurrentProgress(prev => {
        const currentIndex = progressMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % progressMessages.length;
        return progressMessages[nextIndex];
      });
    }, 2000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6">
      <div className="relative">
        <Loader2
          className={`w-8 h-8 animate-spin ${
            mode === "sentinel"
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        />
        <div className="absolute -top-1 -right-1">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              mode === "sentinel"
                ? "bg-indigo-500 dark:bg-indigo-400"
                : "bg-emerald-500 dark:bg-emerald-400"
            }`}
          />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p
          className={`text-sm font-medium animate-pulse ${
            mode === "sentinel"
              ? "text-indigo-600 dark:text-indigo-300"
              : "text-emerald-600 dark:text-emerald-300"
          }`}
        >
          {currentMessage}
        </p>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {currentProgress}
        </p>
      </div>
    </div>
  );
};

export default EnhancedLoading;
