"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";

import Image from "next/image";

import { ToolInvocation } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  ChatErrorType,
  ErrorTypeDescriptions,
  getErrorAction,
} from "@/lib/errors";

import { useMessageQuota } from "@/hooks/useMessageQuota";

import { useChat } from "@/contexts/chat-context";
import { useUser } from "@/contexts/user-context";

import { UIMessage } from "@/app/api/chat/tools/types";
import { CHAT_HIDDEN_TOOLS } from "@/constants/tools";

import { ChatToolCard } from "./chat-tool-card";

interface MessagePart {
  type: "text" | "tool-invocation" | "reasoning" | "source" | "step-start";
  text?: string;
  toolInvocation?: ToolInvocation;
}

interface FollowUpQuestion {
  id: string;
  question: string;
  mode?: "sentinel" | "morpheus";
}

interface ChatGroup {
  type: "user" | "oracle";
  messages: UIMessage[];
  id: string;
  index: number;
}

interface Part {
  type: "text" | "tool-invocation" | "reasoning" | "source" | "step-start";
  text?: string;
  toolInvocation?: ToolInvocation;
}

export function MessageQuota() {
  const { quota, loading } = useMessageQuota();
  const { isPremium } = useUser();

  if (loading || !quota || isPremium) return null;

  return (
    <div
      className={`text-[10px] text-center ${quota.remaining <= 0 ? "text-red-500 dark:text-red-400 font-semibold" : "text-gray-400 dark:text-gray-500"} pt-2`}
    >
      <span>Daily Messages: </span>
      <span
        className={
          quota.remaining <= 3 && quota.remaining > 0
            ? "text-amber-500 dark:text-amber-400"
            : quota.remaining <= 0
              ? "text-red-500 dark:text-red-400 font-semibold"
              : ""
        }
      >
        {quota.usedToday}/{quota.dailyLimit}
        {quota.remaining <= 3 && quota.remaining > 0 && " (running low)"}
        {quota.remaining <= 0 && " (limit reached)"}
      </span>
    </div>
  );
}

const colorizeQuestionModes = (text: string): string => {
  let colorizedText = text.replace(
    /(\*\*sentinel\*\*|Sentinel Mode|sentinel mode)/gi,
    '<span class="text-indigo-600 dark:text-indigo-400 font-semibold">$1</span>'
  );

  colorizedText = colorizedText.replace(
    /(\*\*morpheus\*\*|Morpheus Mode|morpheus mode)/gi,
    '<span class="text-emerald-600 dark:text-emerald-400 font-semibold">$1</span>'
  );

  return colorizedText;
};

function MessagesComponent() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const invocationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { isPendingResponse } = useChat();
  const [flashQuestion, setFlashQuestion] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    error,
    selectedToolId,
    handleRetry,
    sendMessage,
    handleInputChange,
    activeMode,
    setActiveMode,
    isReadOnly,
  } = useChat();

  const getViewport = useCallback(() => scrollAreaRef.current, []);
  const scrollTo = useCallback(
    (element: HTMLElement | undefined, type: "bottom" | "element") => {
      const viewport = getViewport();
      if (!viewport) return;
      if (type === "bottom") {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      } else if (element) {
        const elementTop = element.getBoundingClientRect().top;
        const viewportTop = viewport.getBoundingClientRect().top;
        const offset = elementTop - viewportTop - 6;
        viewport.scrollTo({
          top: viewport.scrollTop + offset,
          behavior: "smooth",
        });
      }
    },
    [getViewport]
  );

  const prevMessagesLengthRef = useRef(messages.length);
  const prevIsLoadingRef = useRef(isLoading);

  useEffect(() => {
    const messagesChanged = prevMessagesLengthRef.current !== messages.length;
    const loadingChanged = prevIsLoadingRef.current !== isLoading;

    prevMessagesLengthRef.current = messages.length;
    prevIsLoadingRef.current = isLoading;

    if (
      !selectedToolId &&
      (messagesChanged || loadingChanged) &&
      messages.length > 0
    ) {
      const timeoutId = setTimeout(() => scrollTo(undefined, "bottom"), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, isLoading, scrollTo, selectedToolId]);

  const [lastSelected, setLastSelected] = useState({ text: "", time: 0 });

  const handleAskQuestion = useCallback(
    (
      question: string,
      questionMode?: "sentinel" | "morpheus",
      messageMode?: string
    ) => {
      const now = Date.now();
      const isDoubleClick =
        lastSelected.text === question && now - lastSelected.time < 500;
      setLastSelected({
        text: question,
        time: now,
      });

      if (questionMode) {
        setActiveMode(questionMode);
      } else if (messageMode) {
        setActiveMode(messageMode as "sentinel" | "morpheus");
      }

      let cleanQuestion = question.replace(/\*\*/g, "");
      cleanQuestion = cleanQuestion.replace(
        /\s+in\s+(Sentinel|Morpheus)\s+Mode(\s+|$)/gi,
        " "
      );
      cleanQuestion = cleanQuestion.trim();

      if (isDoubleClick) {
        setFlashQuestion(cleanQuestion);
        setTimeout(() => {
          setFlashQuestion(null);
          if (sendMessage) sendMessage(cleanQuestion);
          else console.error("sendMessage not available");
        }, 600);
      } else {
        if (handleInputChange) handleInputChange(cleanQuestion);
        else console.error("handleInputChange not available");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastSelected, sendMessage, handleInputChange]
  );

  // Get quota exceeded status from hook at component level
  const { isQuotaExceeded } = useMessageQuota();

  const renderFollowUpButtons = (
    questions: FollowUpQuestion[],
    messageMode?: string
  ) => {
    if (!questions || questions.length === 0 || isReadOnly) return null;

    const defaultMode = messageMode || activeMode;

    return (
      <div className="mt-3 space-y-1">
        <h3
          className={`flex items-center gap-2 text-ms font-semibold mb-2 ${
            defaultMode === "sentinel"
              ? "text-indigo-500 dark:text-indigo-400"
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          Echoes from the Mainframe...
        </h3>
        <div className="space-y-0.5">
          {questions.map(q => {
            const buttonMode = q.mode || defaultMode;

            return (
              <div key={q.id} className="overflow-visible mb-1">
                <motion.div
                  className={`border rounded-md shadow-sm ${!isQuotaExceeded ? "hover:shadow" : ""} transition-shadow ${
                    buttonMode === "sentinel"
                      ? "border-indigo-100/70 dark:border-indigo-800/30"
                      : "border-emerald-100/70 dark:border-emerald-800/30"
                  } ${isQuotaExceeded ? "opacity-60" : ""}`}
                  whileHover={isQuotaExceeded ? {} : { scale: 1.01 }}
                  whileTap={isQuotaExceeded ? {} : { scale: 0.98 }}
                  style={{ transformOrigin: "center" }}
                >
                  <button
                    className={`w-full px-3 py-2 flex items-center justify-between text-left ${isQuotaExceeded ? "cursor-not-allowed" : "cursor-pointer"} transition-colors ${
                      !isQuotaExceeded &&
                      (buttonMode === "sentinel"
                        ? "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
                        : "hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10")
                    }`}
                    onClick={() => {
                      if (!isQuotaExceeded) {
                        handleAskQuestion(q.question, q.mode, defaultMode);
                      }
                    }}
                    title={
                      isQuotaExceeded
                        ? "Daily message limit reached. Upgrade to premium for unlimited messages."
                        : ""
                    }
                  >
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {colorizeQuestionModes(q.question)}
                      </ReactMarkdown>
                    </span>
                    <div
                      className={`rounded-full p-0.5 ${
                        buttonMode === "sentinel"
                          ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      }`}
                    >
                      <ArrowRight size={14} />
                    </div>
                  </button>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMessagePart = (
    part: MessagePart,
    partIndex: number,
    messageIdSeed: string,
    message?: UIMessage
  ) => {
    const currentMode = message?.mode || activeMode;

    if (part.type === "step-start") {
      return null;
    }

    if (part.type === "text" && part.text) {
      const textContent = part.text;

      const followUpRegex =
        /\n\n\*?\*?Echoes from the Mainframe…:\*?\*?\n(1\.(?:.|\n)*?)\n(2\.(?:.|\n)*?)\n(3\.(?:.|\n)*?)\n(4\.(?:.|\n)*?)(?=\n\n|$)/s;

      const followUpMatch = textContent.match(followUpRegex);

      let mainContent = textContent.trim();
      let followUpButtons = null;

      if (followUpMatch) {
        mainContent = textContent.substring(0, followUpMatch.index).trimEnd();
        const rawSuggestions = [
          followUpMatch[1],
          followUpMatch[2],
          followUpMatch[3],
          followUpMatch[4],
        ];

        const questions: FollowUpQuestion[] = rawSuggestions
          .map((rawSuggestion, index) => {
            if (!rawSuggestion) return null;
            const questionText = rawSuggestion.replace(/^\d+\.\s*/, "").trim();

            let mode: "sentinel" | "morpheus" | undefined = undefined;

            if (
              questionText.toLowerCase().includes("sentinel mode") ||
              questionText.toLowerCase().includes("**sentinel")
            ) {
              mode = "sentinel";
            } else if (
              questionText.toLowerCase().includes("morpheus mode") ||
              questionText.toLowerCase().includes("**morpheus")
            ) {
              mode = "morpheus";
            }

            return {
              id: `${messageIdSeed}-part${partIndex}-followup-${index}`,
              question: questionText,
              mode,
            };
          })
          .filter(q => q !== null) as FollowUpQuestion[];

        followUpButtons = renderFollowUpButtons(questions, currentMode);
      }

      return (
        <div key={`text-part-${partIndex}`} className="py-1.5 overflow-visible">
          {mainContent && (
            <div
              className="text-gray-700 whitespace-pre-wrap dark:text-gray-300 markdown-content ultra-compact"
              data-message-mode={currentMode}
            >
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {mainContent}
              </ReactMarkdown>
            </div>
          )}
          {followUpButtons}
        </div>
      );
    }

    if (part.type === "tool-invocation" && part.toolInvocation) {
      // Skip tools that are hidden from the chat message list
      if (CHAT_HIDDEN_TOOLS.includes(part.toolInvocation.toolName)) {
        return null;
      }
      // Check if the tool invocation is already rendered
      return (
        <div
          key={`tool-invocation-${part.toolInvocation.toolCallId}`}
          ref={el => {
            if (el) {
              invocationRefs.current.set(part.toolInvocation!.toolCallId, el);
            }
          }}
          id={`message-tool-${part.toolInvocation.toolCallId}`}
          className={`py-1.5 ${
            part.toolInvocation.toolName === "get_token_info"
              ? "token-metrics-tool"
              : ""
          }`}
        >
          <ChatToolCard
            toolInvocation={part.toolInvocation}
            messageMode={currentMode}
          />
        </div>
      );
    }

    return null;
  };

  const errorAlert = useMemo(() => {
    if (!error || !error.message) return null;

    // Special styling for pending action errors
    const alertVariant =
      error.type === ChatErrorType.PENDING_ACTION ? "default" : "destructive";

    return (
      <Alert variant={alertVariant} className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {error.type === ChatErrorType.RATE_LIMIT
              ? ErrorTypeDescriptions[ChatErrorType.RATE_LIMIT]
              : error.type === ChatErrorType.NETWORK
                ? ErrorTypeDescriptions[ChatErrorType.NETWORK]
                : error.message}
          </span>
          {error.type === ChatErrorType.RATE_LIMIT ? (
            <SubscriptionDialog
              buttonText={getErrorAction(ChatErrorType.RATE_LIMIT)}
              buttonSize="sm"
              buttonVariant="outline"
              buttonClassName="ml-4 bg-white hover:bg-gray-100 hover:text-gray-900"
              source="rate_limit_error"
            />
          ) : error.type === ChatErrorType.NETWORK && handleRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4 bg-white hover:bg-gray-100 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {getErrorAction(ChatErrorType.NETWORK)}
            </Button>
          ) : error.type ===
            ChatErrorType.PENDING_ACTION ? null : handleRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4 bg-white hover:bg-gray-100 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {getErrorAction(ChatErrorType.GENERIC)}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }, [error, handleRetry]);

  return (
    <div
      className="h-full flex flex-col overflow-y-auto w-full scrollbar-at-edge relative"
      data-testid="messages-wrapper"
      ref={scrollAreaRef}
    >
      <div className="flex-1 w-full">
        <div className="flex-1 px-4 pb-40 pt-[120px] md:pt-20 mx-auto max-w-3xl w-full">
          {(() => {
            const groupedMessages: ChatGroup[] = [];
            let currentGroup: ChatGroup | null = null;

            messages?.forEach((message: any, i: number) => {
              const msgWithId = {
                ...message,
                id: message.id || `msg-${i}-${Date.now()}`,
              };

              if (msgWithId.role === "user") {
                if (currentGroup) {
                  groupedMessages.push(currentGroup);
                  currentGroup = null;
                }
                groupedMessages.push({
                  type: "user",
                  messages: [msgWithId],
                  id: msgWithId.id,
                  index: i,
                });
              } else {
                // assistant/tool
                if (!currentGroup) {
                  currentGroup = {
                    type: "oracle",
                    messages: [msgWithId],
                    id: msgWithId.id,
                    index: i,
                  };
                } else {
                  currentGroup.messages.push(msgWithId);
                }
              }
            });
            if (currentGroup) {
              groupedMessages.push(currentGroup);
            }

            // Rendering Groups
            return groupedMessages.map((group: ChatGroup) => {
              if (group.type === "user") {
                const message = group.messages[0];
                const userMessageKey = `user-message-${group.id}`;
                return (
                  <div key={userMessageKey} className="space-y-3 pb-4">
                    <div className="flex justify-end">
                      <div className="max-w-[90%] space-y-1">
                        <div
                          className={`text-gray-900 font-medium rounded-xl rounded-tr-none px-3 py-2 shadow-md dark:text-gray-50
                               ${
                                 (message.mode || activeMode) === "sentinel"
                                   ? "bg-indigo-200/80 dark:bg-indigo-600/50"
                                   : "bg-emerald-200/80 dark:bg-emerald-600/50"
                               }`}
                        >
                          {typeof message.content === "string"
                            ? message.content.trim()
                            : ""}
                        </div>
                        {message.parts?.filter(
                          p => p.type === "tool-invocation"
                        ).length > 0 && (
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400 italic">
                            {
                              message.parts.filter(
                                p => p.type === "tool-invocation"
                              ).length
                            }{" "}
                            Action
                            {message.parts.filter(
                              p => p.type === "tool-invocation"
                            ).length === 1
                              ? ""
                              : "s"}{" "}
                            requested
                          </div>
                        )}
                        {message.parts?.filter(
                          p => p.type === "tool-invocation"
                        ).length > 1 && (
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400 italic">
                            (Actions will be processed sequentially)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Oracle Group Rendering
                const oracleGroupKey = `oracle-group-${group.id}`;
                const totalActions = group.messages.reduce(
                  (total: number, msg: UIMessage) =>
                    total +
                    (msg.parts?.filter(p => p.type === "tool-invocation")
                      .length || 0),
                  0
                );
                return (
                  <div key={oracleGroupKey} className="space-y-3 pb-4">
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Image
                          src="/logo/icon_white.svg"
                          alt="DeFi AI Icon"
                          width={24}
                          height={24}
                          className="invert dark:invert-0 shrink-0"
                        />
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                          ORACLE
                          {totalActions > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              ({totalActions} Action
                              {totalActions === 1 ? "" : "s"})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pl-0 relative">
                        <div className="relative rounded-br-xl rounded-tr-xl rounded-bl-xl overflow-visible">
                          <div className="relative pb-[14px]">
                            <div className="flex flex-col gap-1">
                              {group.messages.map(
                                (message: UIMessage, messageIndex: number) => {
                                  const oracleMessageKey = `oracle-message-${
                                    message.id || group.id + "-" + messageIndex
                                  }`;
                                  const messageMode =
                                    message.mode || activeMode;
                                  return (
                                    <div
                                      key={oracleMessageKey}
                                      className={
                                        messageIndex > 0
                                          ? messageMode === "sentinel"
                                            ? "pt-3 mt-1 border-t border-indigo-100/30 dark:border-indigo-900/30"
                                            : "pt-3 mt-1 border-t border-emerald-100/30 dark:border-emerald-900/30"
                                          : ""
                                      }
                                    >
                                      <div className="space-y-3 overflow-visible">
                                        {message.parts?.map(
                                          (part: Part, partIndex: number) => (
                                            <React.Fragment
                                              key={`${oracleMessageKey}-part-${partIndex}`}
                                            >
                                              {renderMessagePart(
                                                part,
                                                partIndex,
                                                oracleMessageKey,
                                                message
                                              )}
                                            </React.Fragment>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            });
          })()}
          {errorAlert}
          {(isLoading || isPendingResponse) && (
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2 mb-1">
                <Image
                  src="/logo/icon_white.svg"
                  alt="DeFi AI Icon"
                  width={24}
                  height={24}
                  className="invert dark:invert-0 shrink-0"
                />
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  ORACLE
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-1">
                <div
                  className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${
                    activeMode === "sentinel"
                      ? "bg-indigo-500/40 dark:bg-indigo-500"
                      : "bg-emerald-500/40 dark:bg-emerald-500"
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${
                    activeMode === "sentinel"
                      ? "bg-indigo-500/40 dark:bg-indigo-500"
                      : "bg-emerald-500/40 dark:bg-emerald-500"
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full animate-bounce ${
                    activeMode === "sentinel"
                      ? "bg-indigo-500/40 dark:bg-indigo-500"
                      : "bg-emerald-500/40 dark:bg-emerald-500"
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {flashQuestion && (
          <motion.div
            className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-full shadow-lg z-10 ${
              activeMode === "sentinel" ? "bg-indigo-500" : "bg-emerald-500"
            }`}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            transition={{
              duration: 0.3,
            }}
          >
            Asking:
            {flashQuestion}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Messages = React.memo(MessagesComponent);
