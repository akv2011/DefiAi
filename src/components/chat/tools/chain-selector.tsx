import { motion } from "framer-motion";

import { CHAINS, Chain } from "@/lib/chains";

interface ChainSelectorProps {
  selectedChain: Chain | null;
  onSelect: (chain: Chain) => void;
  disabled?: boolean;
}

export function ChainSelector({
  selectedChain,
  onSelect,
  disabled = false,
}: ChainSelectorProps) {
  const premiumVariants = {
    hover: {
      scale: 1.03,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.98,
      y: 0,
      transition: {
        duration: 0.15,
      },
    },
    selected: {
      scale: 1.02,
      y: -1,
    },
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center sm:justify-start px-2 py-2 mx-auto w-full max-w-[450px] sm:max-w-none">
      {CHAINS.map(chain => (
        <motion.button
          key={chain}
          variants={premiumVariants}
          whileHover={
            !disabled && selectedChain !== chain ? "hover" : undefined
          }
          whileTap={!disabled && selectedChain !== chain ? "tap" : undefined}
          animate={selectedChain === chain ? "selected" : undefined}
          onClick={() => onSelect(chain as Chain)}
          disabled={disabled && selectedChain !== chain}
          className={`
            relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-xl
            transition-all duration-300 ease-out
            flex-grow-0 flex-shrink-0 
            min-w-16 sm:min-w-0
            text-center justify-center
            ${
              selectedChain === chain
                ? "bg-gradient-to-br from-emerald-500/20 via-emerald-600/25 to-emerald-500/20 dark:from-emerald-400/20 dark:via-emerald-500/25 dark:to-emerald-400/20 text-emerald-700 dark:text-emerald-200 shadow-inner shadow-emerald-500/10"
                : "bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-900/50 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-300"
            }
            ${
              disabled && selectedChain !== chain
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
            }
            group overflow-hidden
          `}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 dark:from-emerald-400/0 dark:via-emerald-400/10 dark:to-emerald-400/0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: selectedChain === chain ? 0.8 : 0,
              transition: {
                duration: 0.4,
              },
            }}
            whileHover={{
              opacity: selectedChain !== chain ? 0.5 : 0.8,
              transition: {
                duration: 0.2,
              },
            }}
          />

          <div
            className={`
            absolute inset-0 rounded-xl ring-1 ring-inset transition-all duration-300
            ${
              selectedChain === chain
                ? "ring-emerald-500/40 dark:ring-emerald-400/40 shadow-[0_4px_24px_rgba(16,185,129,0.15)] dark:shadow-[0_4px_24px_rgba(52,211,153,0.15)]"
                : "ring-gray-200/40 dark:ring-gray-800/40 group-hover:ring-emerald-500/25 dark:group-hover:ring-emerald-400/25"
            }
          `}
          />

          <motion.img
            src={`/chains/${chain}.png`}
            alt={chain}
            className="w-5 h-5"
            animate={{
              scale: selectedChain === chain ? 1.15 : 1,
              rotate: selectedChain === chain ? 360 : 0,
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          />

          {/* Text */}
          <span className="text-xs sm:text-sm font-semibold tracking-wider bg-gradient-to-r from-current to-current bg-clip-text">
            {chain.charAt(0).toUpperCase() + chain.slice(1)}
          </span>

          {/* Shine effect */}
          {selectedChain === chain && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              initial={{ x: "-100%" }}
              animate={{
                x: "100%",
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                },
              }}
            >
              <div className="w-20 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 transform skew-x-[-30deg]" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
