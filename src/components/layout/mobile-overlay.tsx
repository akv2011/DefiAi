import React from "react";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface MobileOverlayProps {
  isVisible: boolean;
  onClick: () => void;
}

export function MobileOverlay({ isVisible, onClick }: MobileOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          )}
          style={{
            touchAction: "none",
            width: "100%",
            overflowX: "hidden",
          }}
          onClick={onClick}
        />
      )}
    </AnimatePresence>
  );
}
