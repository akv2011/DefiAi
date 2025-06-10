import Link from "next/link";

import { ConnectKitButton } from "connectkit";
import { RefreshCw, Shield, Sparkles } from "lucide-react";

export function ChatDisconnectedCard() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-neutral-950 backdrop-blur-md rounded-lg border border-primary/30">
      <div className="p-3 bg-primary/20 rounded-full mb-4">
        <RefreshCw className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-primary mb-2">Session Expired</h2>
      <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
        Your wallet connection has been lost. Connect your wallet to continue
        viewing this chat.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-xs mx-auto sm:max-w-none justify-center">
        <ConnectKitButton.Custom>
          {({ isConnecting, show }) => {
            return (
              <button
                onClick={show}
                className="w-full sm:w-auto text-center text-black bg-primary hover:bg-primary/90 py-3 px-6 rounded-lg 
                transition-all duration-300 flex items-center justify-center font-medium shadow-md cursor-pointer"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            );
          }}
        </ConnectKitButton.Custom>

        <Link
          href="/"
          className="w-full sm:w-auto text-center text-gray-300 hover:text-white border border-gray-700
          hover:bg-black/60 py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export function DisconnectedCard() {
  return (
    <div className="flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      <div className="absolute inset-0 z-20">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/30 animate-float"
            style={{
              width: `${Math.max(1, Math.random() * 3)}px`,
              height: `${Math.max(1, Math.random() * 3)}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 15 + 15}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-30 flex flex-col items-center justify-center w-full p-20 pointer-events-auto">
        <div className="flex flex-col items-center max-w-3xl mx-auto">
          <div
            className="text-center space-y-6 sm:space-y-8 md:space-y-10 px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 rounded-2xl sm:rounded-3xl
        backdrop-blur-xl bg-white dark:bg-neutral-950
        border border-primary/30 shadow-[0_0_80px_rgba(71,216,163,0.2)]
        relative overflow-hidden z-40"
          >
            <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 border-b border-r border-primary/30 rounded-br-2xl sm:rounded-br-3xl z-20 pointer-events-none"></div>

            <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-transparent blur-3xl opacity-50 z-10 pointer-events-none"></div>

            <div className="flex justify-center mb-6 sm:mb-8 relative">
              <div className="relative transition-all duration-500 group">
                <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 3001 3001"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-all duration-500"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1230.1 2093.81C1198.92 2094.88 1169.41 2079.74 1152.11 2053.79L904.827 1682.86H588.99V1502.86H952.993C983.085 1502.86 1011.19 1517.9 1027.88 1542.93L1221.1 1832.77L1696.86 1000.2C1713.33 971.378 1744.32 953.962 1777.5 954.883C1810.68 955.804 1840.66 974.912 1855.5 1004.6L2104.63 1502.86H2413.01V1682.86H2049.01C2014.92 1682.86 1983.76 1663.6 1968.51 1633.11L1769.71 1235.51L1305.14 2048.51C1289.66 2075.6 1261.27 2092.74 1230.1 2093.81Z"
                      fill="var(--color-primary, #47D8A3)"
                    />
                    <path
                      d="M449.641 2229.23H173.239V771.114H449.641V626.904H0.989014V2373.44H449.641V2229.23Z"
                      fill="var(--color-primary, #47D8A3)"
                    />
                    <path
                      d="M2552.35 2229.23H2828.75V771.111H2552.35V626.902H3001V2373.44H2552.35V2229.23Z"
                      fill="var(--color-primary, #47D8A3)"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-snug relative z-10 tracking-tight">
              Matrix Gateway
            </h1>

            <div className="space-y-4 sm:space-y-5 md:space-y-7 max-w-xl mx-auto">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-100 leading-relaxed relative z-10 font-medium">
                Connect your Wallet to access the Terminal. Sign in via
                Signature to unlock the Matrix.
              </p>

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100/80 dark:bg-black/40 rounded-full backdrop-blur-md border border-gray-200/50 dark:border-gray-800/30 hover:border-primary/20 transition-all duration-300">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  <span className="text-xs text-gray-700 dark:text-gray-200">
                    Secure Connection
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100/80 dark:bg-black/40 rounded-full backdrop-blur-md border border-gray-200/50 dark:border-gray-800/30 hover:border-primary/20 transition-all duration-300">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  <span className="text-xs text-gray-700 dark:text-gray-200">
                    Premium Access
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative z-10 max-w-md mx-auto">
                This signature does not give anyone access to your funds and
                will not be shared with any third parties. Signing your
                blockchain address is anonymous and does not compromise your
                identity or assets.
              </p>
            </div>

            <div className="pt-4 sm:pt-6 md:pt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 justify-center max-w-xs mx-auto sm:max-w-none w-full relative z-50 pointer-events-auto">
              <ConnectKitButton.Custom>
                {({ isConnecting, show }) => {
                  return (
                    <button
                      onClick={show}
                      className="w-full sm:w-auto text-center text-black bg-primary hover:bg-primary/90 py-3 px-6 rounded-lg 
                      transition-all duration-300 flex items-center justify-center font-medium shadow-md relative z-50 cursor-pointer"
                    >
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                  );
                }}
              </ConnectKitButton.Custom>

              <Link
                href="https://enter.thematrix.app/"
                className="w-full sm:w-auto text-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white border border-gray-300 dark:border-gray-700 cursor-pointer
                hover:bg-gray-100/50 dark:hover:bg-black/60 py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center relative z-50"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
