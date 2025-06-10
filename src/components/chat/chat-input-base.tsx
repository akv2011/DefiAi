"use client";

import React, {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { generateId } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Database, RotateCw, Send, StopCircle } from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMessageQuota } from "@/hooks/useMessageQuota";

import { useChat } from "@/contexts/chat-context";

import { SubscriptionDialog } from "../subscription/SubscriptionDialog";
import { MessageQuota } from "./messages";

export type ChatMode = "morpheus" | "sentinel";

interface BaseChatInputProps {
  input?: string;
  onChange?: (value: string) => void;
  onReload?: () => void;

  initialMode?: ChatMode;
  onSubmitMessage?: () => void;
  onSubmit?: (e: FormEvent) => Promise<void>;
  showReloadButton?: boolean;
  className?: string;
}

export default function BaseChatInput({
  input = "",
  onChange,
  onReload,
  initialMode = "morpheus",
  onSubmitMessage,
  onSubmit,
  showReloadButton = false,
  className = "",
}: BaseChatInputProps) {
  const {
    handleSubmit: normalHandleSubmit,
    addAssistantMessage,
    isPendingResponse,
    activeMode,
    setActiveMode,
    isLoading,
    abortStream,
  } = useChat();
  const { toast } = useToast();

  const { isQuotaExceeded, loading: isQuotaLoading } = useMessageQuota();

  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isMorpheusMode, setIsMorpheusMode] = useState(
    activeMode === "morpheus"
  );
  const [rows, setRows] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { address } = useAccount();
  const isBusy = isLoading || isPendingResponse;

  useEffect(() => {
    setIsMorpheusMode(activeMode === "morpheus");

    if (initialMode && initialMode !== activeMode) {
      setActiveMode?.(activeMode);
    }
  }, [activeMode, initialMode, setActiveMode]);

  useEffect(() => {
    if (!isPendingResponse) {
      setIsSubmitting(false);
    }
  }, [isPendingResponse]);

  useEffect(() => {
    if (!isBusy && isSubmitting) {
      const timer = setTimeout(() => {
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isBusy, isSubmitting]);

  useEffect(() => {
    if (textareaRef.current) {
      const lineCount = (input.match(/\n/g) || []).length + 1;
      setRows(Math.min(Math.max(lineCount, 1), 6));
    }
  }, [input]);

  const onFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isQuotaExceeded) {
      toast({
        title: "Daily message limit exceeded",
        description:
          "You've reached your daily message limit. Please upgrade to premium for unlimited messages.",
        variant: "destructive",
        action: (
          <SubscriptionDialog
            buttonText="Upgrade"
            buttonSize="sm"
            buttonVariant="outline"
            buttonClassName="bg-white text-black hover:bg-gray-100 hover:text-black"
            source="message_limit_toast"
          />
        ),
      });
      return;
    }

    if (!input.trim() || isBusy || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (onSubmitMessage) {
        onSubmitMessage();
      }

      if (onSubmit) {
        await onSubmit(e);
      } else {
        console.log(
          "Form submit - calling normalHandleSubmit for mode:",
          activeMode
        );
        normalHandleSubmit(e);
      }
    } catch (error: any) {
      console.error("Search Error:", error);
      addAssistantMessage({
        id: generateId(),
        content: `${
          activeMode === "morpheus" ? "MORPHEUS MODE" : "SENTINEL MODE"
        } Error: ${error.message || "Unknown error"}`,
      });
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isBusy && !isSubmitting) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  // Define mode-specific styles with emerald as the main color for Morpheus
  // and indigo for Sentinel, supporting both light and dark modes
  const modeColors = isMorpheusMode
    ? {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
        secondary:
          "bg-emerald-500/20 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
        border:
          "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/30",
        buttonGlow: "shadow-none",
        inputGlow:
          "shadow-[0_0_10px_rgba(16,185,129,0.15)] dark:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
        focusRing:
          "focus:ring-emerald-500/40 focus:border-emerald-600 dark:focus:ring-emerald-700/40 dark:focus:border-emerald-800",
        icon: "text-emerald-600 dark:text-emerald-400",
        bgHighlight: "bg-emerald-100/60 dark:bg-emerald-900/60",
        badge:
          "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200",
        gradientText:
          "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent",
        bgHover: "hover:bg-emerald-50 dark:hover:bg-emerald-900/40",
        activeToggle:
          "bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300",
      }
    : {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
        secondary:
          "bg-indigo-500/20 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
        border:
          "border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/30",
        buttonGlow: "shadow-none",
        inputGlow:
          "shadow-[0_0_10px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]",
        focusRing:
          "focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:ring-indigo-700/40 dark:focus:border-indigo-800",
        icon: "text-indigo-600 dark:text-indigo-400",
        bgHighlight: "bg-indigo-100/60 dark:bg-indigo-900/60",
        badge:
          "bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200",
        gradientText:
          "bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-300 dark:to-blue-300 bg-clip-text text-transparent",
        bgHover: "hover:bg-indigo-50 dark:hover:bg-indigo-900/40",
        activeToggle:
          "bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300",
      };

  // Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  const toggleVariants = {
    hidden: { y: -10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.1,
        duration: 0.3,
      },
    },
  };

  const inputVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: 0.3,
      },
    },
    hover: {
      borderColor: "rgba(var(--color-primary), 0.3)",
      transition: {
        duration: 0.4,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`relative ${className}`}
    >
      <div className="max-w-3xl mx-auto relative">
        {/* Action Buttons - Positioned inside the chat input */}
        <div className="absolute right-2 top-2 flex items-center gap-1.5 z-10">
          <AnimatePresence mode="wait">
            {isBusy ? (
              <motion.div
                key="stop-button"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15, ease: "easeOut" },
                }}
                exit={{ opacity: 0 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={abortStream}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0 
                          flex items-center justify-center
                          bg-gray-100/40 hover:bg-gray-200/60 dark:bg-gray-800/40 dark:hover:bg-gray-700/60
                          text-gray-600 dark:text-gray-400
                          border border-gray-200/60 dark:border-gray-700/60
                          transition-all duration-200
                          cursor-pointer"
                        aria-label="Stop streaming"
                      >
                        <StopCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 dark:text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Stop generating response
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            ) : (
              showReloadButton &&
              onReload && (
                <motion.div
                  key="reload-button"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: {
                      delay: 0.05,
                      duration: 0.15,
                      ease: "easeOut",
                    },
                  }}
                  exit={{ opacity: 0 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={onReload}
                          disabled={isBusy}
                          className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0
                            ${
                              !isBusy
                                ? "bg-gray-100/40 hover:bg-gray-200/60 dark:bg-gray-800/40 dark:hover:bg-gray-700/60"
                                : "bg-gray-50/20 dark:bg-gray-900/20"
                            }
                            text-gray-600 dark:text-gray-400
                            border border-gray-200/60 dark:border-gray-700/60
                            overflow-hidden transition-colors
                            ${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label="Reload chat"
                        >
                          <RotateCw
                            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 dark:text-gray-400 ${isBusy ? "animate-spin" : ""}`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-gray-900">
                        Regenerate response
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {input.trim() && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                  transition: {
                    duration: 0.15,
                    ease: "easeOut",
                  },
                }}
                exit={{
                  opacity: 0,
                  transition: {
                    duration: 0.1,
                  },
                }}
              >
                <Button
                  type="submit"
                  form="chat-form"
                  disabled={isBusy || isSubmitting}
                  className={`
                    h-7 w-7 sm:h-8 sm:w-8 rounded-lg p-0
                    flex items-center justify-center
                    ${modeColors.primary}
                    ${modeColors.buttonGlow}
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    cursor-pointer
                  `}
                >
                  {isBusy || isSubmitting ? (
                    <RotateCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                  ) : (
                    <motion.div>
                      <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form id="chat-form" onSubmit={onFormSubmit} className="relative">
          <div className="flex flex-col">
            {/* Input field with glow effect */}
            <motion.div
              className={`w-full relative group transition-all duration-400 ease-in-out rounded-xl
                ${
                  isBusy
                    ? `${
                        isMorpheusMode
                          ? "shadow-none border border-emerald-300/70 dark:border-emerald-800/30 overflow-hidden bg-white/95 dark:bg-neutral-800 backdrop-blur-md"
                          : "shadow-none border border-indigo-300/70 dark:border-indigo-800/30 overflow-hidden bg-white/95 dark:bg-neutral-800 backdrop-blur-md"
                      }`
                    : `shadow-none border shadow-lg backdrop-blur-md bg-white/15 dark:bg-black/15 ${
                        isMorpheusMode
                          ? "border-emerald-300/70 dark:border-emerald-800/30 dark:border-emerald-500/20 hover:border-emerald-400/80 dark:hover:border-emerald-400/30"
                          : "border-indigo-300/70 dark:border-indigo-800/30 dark:border-indigo-500/20 hover:border-indigo-400/80 dark:hover:border-indigo-400/30"
                      } overflow-hidden bg-white/95 dark:bg-neutral-800 backdrop-blur-md`
                }`}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Main input textarea */}
              <Textarea
                ref={textareaRef}
                placeholder={
                  isMorpheusMode
                    ? "Ask for market intelligence..."
                    : "Enter blockchain commands..."
                }
                value={input}
                onChange={e => onChange?.(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={rows}
                disabled={
                  isBusy || isSubmitting || (isQuotaExceeded && !isQuotaLoading)
                }
                data-testid="chat-input"
                className={`
                  py-3 sm:py-4 px-3 sm:px-4 pr-16 sm:pr-24
                  resize-none
                  text-sm sm:text-base
                  min-h-[50px] sm:min-h-[56px]
                  bg-transparent
                  border-none
                  border-b-0
                  text-gray-800 dark:text-gray-100 
                  ${
                    isMorpheusMode
                      ? "placeholder:text-emerald-900/40 dark:placeholder:text-emerald-100/60"
                      : "placeholder:text-indigo-900/40 dark:placeholder:text-indigo-100/60"
                  }
                  placeholder:text-sm
                  focus:ring-0 focus:ring-offset-0 
                  focus:outline-none
                  focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent
                  focus-visible:outline-none 
                  ring-0 ring-transparent ring-offset-0
                  shadow-none
                  pb-0
                  mb-0
                  transition-all duration-200
                `}
              />

              {/* Mode toggle button container - now as a separate div below the input */}
              <div
                className={`
                  w-full h-[36px] 
                  flex items-center
                  rounded-b-xl
                  border-none
                  border-t-0
                  shadow-none
                  pt-0
                  mt-0
                  bg-transparent pb-1
                  transition-all duration-200
                `}
              >
                <div className="ml-2 flex items-center gap-1">
                  {/* Mode Toggle Buttons - Bottom left */}
                  <motion.div
                    className={`inline-flex rounded-lg p-0.5 bg-gray-100/70 dark:bg-neutral-900/70 backdrop-blur-sm border border-gray-200 dark:border-gray-800 
                    ${isBusy ? "relative opacity-90" : ""}`}
                    variants={toggleVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Mobile buttons without tooltips */}
                    {isMobile ? (
                      <>
                        {/* Disabled overlay for mobile */}
                        {isBusy && (
                          <div className="absolute inset-0 bg-transparent rounded-lg z-10 cursor-not-allowed">
                            <span className="sr-only">
                              Mode switching disabled while response is
                              generating
                            </span>
                          </div>
                        )}

                        {/* Morpheus Button for mobile */}
                        <motion.button
                          type="button"
                          onClick={() => setActiveMode("morpheus")}
                          disabled={isBusy}
                          className={`
                          px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5
                          transition-all duration-200 
                          ${
                            isMorpheusMode
                              ? "bg-emerald-100/80 dark:bg-emerald-800/80 text-emerald-700 dark:text-emerald-300 backdrop-blur-sm"
                              : "bg-transparent text-gray-600 dark:text-gray-400"
                          }
                          ${
                            isBusy
                              ? "opacity-80 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        `}
                          whileTap={{
                            scale: 0.97,
                          }}
                        >
                          <BookOpen
                            className={`h-3 w-3 ${
                              isMorpheusMode
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          />
                          <span>Morpheus</span>
                        </motion.button>

                        {/* Sentinel Button for mobile */}
                        <motion.button
                          type="button"
                          onClick={() => setActiveMode("sentinel")}
                          disabled={isBusy}
                          className={`
                          px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5
                          transition-all duration-200 
                          ${
                            !isMorpheusMode
                              ? "bg-indigo-100/80 dark:bg-indigo-800/80 text-indigo-700 dark:text-indigo-300 backdrop-blur-sm"
                              : "bg-transparent text-gray-600 dark:text-gray-400"
                          }
                          ${
                            isBusy
                              ? "opacity-80 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        `}
                          whileTap={{
                            scale: 0.97,
                          }}
                        >
                          <Database
                            className={`h-3 w-3 ${
                              !isMorpheusMode
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          />
                          <span>Sentinel</span>
                        </motion.button>
                      </>
                    ) : (
                      <>
                        {/* Desktop version with tooltips */}
                        {/* Overlay with tooltip when disabled */}
                        {isBusy && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute inset-0 bg-transparent rounded-lg z-10 cursor-not-allowed">
                                  {/* Invisible overlay that just captures clicks */}
                                  <span className="sr-only">
                                    Mode switching disabled while response is
                                    generating
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                className="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 shadow-md"
                                side="top"
                                sideOffset={5}
                              >
                                <p className="text-xs">
                                  Mode switching is locked while a response is
                                  generating
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Morpheus Button with Tooltip for desktop */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.button
                                type="button"
                                onClick={() => setActiveMode("morpheus")}
                                disabled={isBusy}
                                className={`
                                px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5
                                transition-all duration-200 
                                ${
                                  isMorpheusMode
                                    ? "bg-emerald-100/80 dark:bg-emerald-800/80 text-emerald-700 dark:text-emerald-300 backdrop-blur-sm"
                                    : "bg-transparent text-gray-600 dark:text-gray-400"
                                }
                                ${
                                  isBusy
                                    ? "opacity-80 cursor-not-allowed"
                                    : "cursor-pointer"
                                }
                              `}
                                whileTap={{
                                  scale: 0.97,
                                }}
                              >
                                <BookOpen
                                  className={`h-3 w-3 ${
                                    isMorpheusMode
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-gray-500 dark:text-gray-500"
                                  }`}
                                />
                                <span>Morpheus</span>
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent
                              className="bg-emerald-100 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-50 border border-emerald-200 dark:border-emerald-700 shadow-md"
                              side="bottom"
                              sideOffset={5}
                            >
                              <p>
                                Market Intelligence AI assistant that provides
                                DeFi insights and analytics
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Sentinel Button with Tooltip for desktop */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.button
                                type="button"
                                onClick={() => setActiveMode("sentinel")}
                                disabled={isBusy}
                                className={`
                                px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5
                                transition-all duration-200 
                                ${
                                  !isMorpheusMode
                                    ? "bg-indigo-100/80 dark:bg-indigo-800/80 text-indigo-700 dark:text-indigo-300 backdrop-blur-sm"
                                    : "bg-transparent text-gray-600 dark:text-gray-400"
                                }
                                ${
                                  isBusy
                                    ? "opacity-80 cursor-not-allowed"
                                    : "cursor-pointer"
                                }
                              `}
                                whileTap={{
                                  scale: 0.97,
                                }}
                              >
                                <Database
                                  className={`h-3 w-3 ${
                                    !isMorpheusMode
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : "text-gray-500 dark:text-gray-500"
                                  }`}
                                />
                                <span>Sentinel</span>
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent
                              className="bg-indigo-100 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-50 border border-indigo-200 dark:border-indigo-700 shadow-md"
                              side="bottom"
                              sideOffset={5}
                            >
                              <p>
                                Blockchain command assistant for executing
                                transactions and interacting with protocols
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </motion.div>
                </div>

                {address && (
                  <div className="absolute right-0 bottom-0 mb-2 mr-2">
                    <MessageQuota />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
