"use client";

import { ConnectKitButton } from "connectkit";
import { Shield } from "lucide-react";

export const MatrixConnectButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address, ensName }) => {
        return (
          <div>
            {isConnected ? (
              <div
                onClick={show}
                className="bg-background/90 backdrop-blur-md rounded-full border border-gray-800/20 dark:border-gray-700/40 h-8 flex items-center pl-2 pr-3 cursor-pointer hover:border-primary/20 transition-colors"
              >
                <div className="bg-gradient-to-b from-primary/5 to-transparent absolute inset-0 rounded-full pointer-events-none opacity-50"></div>
                <div className="w-4 h-4 rounded-full bg-green-400 mr-2"></div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {ensName ||
                    address?.substring(0, 6) +
                      "..." +
                      address?.substring(address.length - 4)}
                </span>
              </div>
            ) : (
              <div
                onClick={show}
                className="bg-background/90 backdrop-blur-md rounded-full border border-gray-800/20 dark:border-gray-700/40 h-8 flex items-center pl-2 pr-3 cursor-pointer hover:border-primary/20 transition-colors"
              >
                <div className="bg-gradient-to-b from-primary/5 to-transparent absolute inset-0 rounded-full pointer-events-none opacity-50"></div>
                <Shield className="w-4 h-4 text-primary mr-2" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {isConnecting ? "Connecting..." : "Connect"}
                </span>
              </div>
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
