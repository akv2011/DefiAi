import * as React from "react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo } from "react";

import { Message, useChat } from "@ai-sdk/react";
import { ToolInvocation, generateId } from "ai";

import {
  ChatErrorType,
  ErrorTypeDescriptions,
  getErrorTypeFromStatus,
  isActionableError,
} from "@/lib/errors";
import {
  getCurrentModeFromStorage,
  hasToolCompletedSuccessfully,
  isToolAborted,
} from "@/lib/utils";

import { useSplitLayout } from "@/contexts/split-layout-context";
import { useTab } from "@/contexts/tab-context";

import { UIMessage } from "@/app/api/chat/tools/types";
import { SIDEBAR_HIDDEN_TOOLS } from "@/constants/tools";

interface UseUnifiedChatProps {
  id: string;
  address?: string;
  initialMessages?: UIMessage[];
  searchType?: string;
  isReadOnly?: boolean;
  addAssistantMessageFromContext: (payload: {
    id: string;
    content: string;
    role: "assistant";
  }) => void;
  onSubmitMessage?: () => void;
  onFinishResponse?: () => void;
  activeMode: "morpheus" | "sentinel";
}

export type UnifiedChatReturn = ReturnType<typeof useUnifiedChat>;

interface PendingToolState {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state: "partial-call" | "result";
}

export interface ChatError {
  type: ChatErrorType;
  message: string;
  details?: string;
  toolInvocation?: ToolInvocation;
  handled: boolean;
}

export function useUnifiedChat({
  id,
  address,
  initialMessages = [],
  searchType: initialSearchType,
  isReadOnly = false,
  addAssistantMessageFromContext,
  onSubmitMessage,
  onFinishResponse,
  activeMode,
}: UseUnifiedChatProps) {
  const [pendingToolCall, setPendingToolCall] =
    React.useState<ToolInvocation | null>(null);
  const [error, setError] = React.useState<ChatError>({
    type: ChatErrorType.NONE,
    message: "",
    handled: true,
  });
  const [isGenerating, setIsGenerating] = React.useState(false);

  const [, setActiveTab] = useTab();
  const toolInvocationsRef = React.useRef<Record<string, PendingToolState>>({});
  const [tools, setTools] = React.useState<ToolInvocation[]>([]);
  const [selectedToolId, setSelectedToolId] = React.useState<string | null>(
    null
  );

  const previousChatIdRef = React.useRef<string>(id);
  const isMorpheusSearchRef = React.useRef(false);
  const morpheusSearchContentBufferRef = React.useRef<string>("");
  const morpheusSearchMetadataRef = React.useRef<any>({});
  const messageCountRef = React.useRef<number>(0);
  const previousStatusRef = React.useRef<string>("idle");
  const appendedErrorIdsRef = React.useRef<Set<string>>(new Set());
  const lastActionAppendedErrorRef = React.useRef(false);
  const navigatedToRootRef = React.useRef(false);
  const [isAborting, setIsAborting] = React.useState(false);

  const { setIsRightSidebarExpanded } = useSplitLayout();
  const readerRef = React.useRef<ReadableStreamDefaultReader | null>(null);
  const processedInvocationsRef = React.useRef<Set<string>>(new Set());

  const clearError = useCallback(() => {
    setError({
      type: ChatErrorType.NONE,
      message: "",
      handled: true,
    });
  }, []);

  const sanitizeMorpheusSearchContent = (content: string): string => {
    let cleanedContent = content.replace(/(\n\s*\n\s*\n\s*)+/g, "\n\n");
    cleanedContent = cleanedContent.replace(/\*\s+([^\n]+)/g, "* $1");
    return cleanedContent;
  };

  const saveChat = async (currentMessages: any[]): Promise<boolean> => {
    try {
      const messagesToSave = [...currentMessages];

      if (
        isMorpheusSearchRef.current &&
        morpheusSearchContentBufferRef.current.length > 0
      ) {
        const searchContent = sanitizeMorpheusSearchContent(
          morpheusSearchContentBufferRef.current
        );

        const searchMessage = {
          id: `msg-morpheus-${Date.now()}`,
          role: "assistant",
          content: searchContent,
        };

        messagesToSave.push(searchMessage);
      }

      if (messagesToSave.length === 0) {
        messagesToSave.push({
          id: `msg-user-${Date.now()}`,
          role: "user",
          content: "Start a new conversation",
        });
      }

      return saveCurrentChat(messagesToSave);
    } catch (saveError) {
      console.error("Exception during morpheus chat save:", saveError);
      return false;
    }
  };

  const safeJsonParse = (jsonString: string, defaultValue = {}) => {
    const trimmed = jsonString.trim();
    if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      console.warn("Incomplete JSON string, skipping parse:", jsonString);
      return defaultValue;
    }
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.error("Error parsing JSON:", e, "Raw data:", jsonString);
      return defaultValue;
    }
  };

  // Add tool to the unified tools array
  const addTool = useCallback((toolInvocation: ToolInvocation) => {
    setTools(prev => {
      const existingIndex = prev.findIndex(
        existing => existing.toolCallId === toolInvocation.toolCallId
      );
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        // Handle both partial-call and call states
        if (
          ((existing.state === "partial-call" || existing.state === "call") &&
            "result" in toolInvocation) ||
          (existing.state === "result" && "result" in toolInvocation)
        ) {
          const updated = [...prev];
          updated[existingIndex] = toolInvocation;
          return updated;
        }
        return prev;
      }
      return [...prev, toolInvocation];
    });
  }, []);

  const processedInitialMessages = React.useMemo(() => {
    return initialMessages.map(message => ({
      ...message,
      content: Array.isArray(message.content)
        ? message.content[0].text
        : message.content,
    })) as Message[];
  }, [initialMessages]);

  const processChunk = async (chunk: string) => {
    // Skip processing if reader has been released (stream aborted)
    if (!readerRef.current) {
      return;
    }

    if (chunk.includes("tool") || chunk.includes("invocation")) {
      try {
        const match = chunk.match(/\{.*\}/);
        if (match) {
          const parsed = safeJsonParse(match[0]);

          if (parsed.toolCallId && parsed.result && !parsed.toolName) {
            // This is a result, not an invocation - handled in result section
          } else if (parsed.toolCallId && parsed.toolName) {
            const { toolCallId, toolName, args = {} } = parsed;

            updateToolInvocations(toolCallId, {
              toolCallId,
              toolName,
              args,
            });
          }
        }
      } catch (e) {
        console.error("Error parsing tool chunk:", e);
      }
    }

    if (chunk.includes("result")) {
      try {
        const match = chunk.match(/\{.*\}/);
        if (match) {
          const parsed = safeJsonParse(match[0]);

          if (parsed.toolCallId && parsed.result) {
            const storedTool = toolInvocationsRef.current[parsed.toolCallId];

            if (storedTool) {
              const currentMode = getCurrentModeFromStorage();

              const finalInvocation = {
                state: "result" as const,
                toolCallId: parsed.toolCallId,
                toolName: storedTool.toolName,
                args: storedTool.args,
                result: parsed.result,
                message: {
                  mode: currentMode,
                },
              };

              const isRootPage =
                typeof window !== "undefined" &&
                window.location.pathname === "/";

              addTool(finalInvocation);

              if (
                !SIDEBAR_HIDDEN_TOOLS.includes(storedTool.toolName as any) &&
                !isRootPage
              ) {
                setActiveTab("tools");
                setIsRightSidebarExpanded(true);
                setSelectedToolId(parsed.toolCallId);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error processing result chunk:", e);
      }
    }

    // Handle Morpheus search specific chunks
    if (isMorpheusSearchRef.current) {
      if (chunk.startsWith("f:{")) {
        try {
          const jsonMatch = chunk.match(/f:(\{.*?\})/);
          if (jsonMatch && jsonMatch[1]) {
            const jsonStringToParse = jsonMatch[1];
            const parsed = safeJsonParse(jsonStringToParse);
            morpheusSearchMetadataRef.current = {
              ...morpheusSearchMetadataRef.current,
              header: parsed,
            };
          }
        } catch (e) {
          console.error("Error parsing morpheus-search header JSON:", e);
        }
      } else if (chunk.startsWith("0:")) {
        const content = chunk.substring(2);

        if (morpheusSearchContentBufferRef.current.length > 0) {
          if (!content.startsWith("\n")) {
            morpheusSearchContentBufferRef.current += "\n" + content;
          } else {
            morpheusSearchContentBufferRef.current += content;
          }
        } else {
          morpheusSearchContentBufferRef.current = content;
        }
      } else if (chunk.startsWith("e:{")) {
        try {
          const jsonMatch = chunk.match(/e:(\{.*\})/);
          if (jsonMatch && jsonMatch[1]) {
            const jsonStringToParse = jsonMatch[1];
            const parsed = safeJsonParse(jsonStringToParse);
            morpheusSearchMetadataRef.current = {
              ...morpheusSearchMetadataRef.current,
              footer: parsed,
            };
          }
        } catch (e) {
          console.error("Error parsing morpheus-search footer JSON:", e);
        }

        const formattedContent = sanitizeMorpheusSearchContent(
          morpheusSearchContentBufferRef.current
        );

        if (formattedContent.trim()) {
          const msgId = generateId();

          // Add to UI context
          addAssistantMessageFromContext({
            id: msgId,
            content: formattedContent,
            role: "assistant",
          });

          // Save to database
          const searchInput =
            messages.length > 0
              ? messages[messages.length - 1].content
              : "Search query";

          // Get current mode from localStorage
          let currentMode = "morpheus"; // Default for morpheus search
          if (typeof window !== "undefined") {
            try {
              const storedMode = localStorage.getItem("messageMode");
              if (storedMode === "morpheus" || storedMode === "sentinel") {
                currentMode = storedMode;
              }
            } catch (e) {
              console.error(
                "Error accessing localStorage in morpheus search:",
                e
              );
            }
          }

          // Only save if not read-only
          if (!isReadOnly) {
            saveChat([
              {
                id: `msg-user-${Date.now()}`,
                role: "user",
                content: searchInput,
                mode: currentMode,
              },
              {
                id: msgId,
                role: "assistant",
                content: formattedContent,
                mode: currentMode,
              },
            ]).catch(e => console.error("Failed to save morpheus search:", e));
          }
        }

        // Reset state after saving
        morpheusSearchContentBufferRef.current = "";
        morpheusSearchMetadataRef.current = {};
        isMorpheusSearchRef.current = false;
      } else if (chunk.startsWith("d:{")) {
        try {
          const jsonMatch = chunk.match(/d:(\{.*\})/);
          if (jsonMatch && jsonMatch[1]) {
            const jsonStringToParse = jsonMatch[1];
            const parsed = safeJsonParse(jsonStringToParse);
            morpheusSearchMetadataRef.current = {
              ...morpheusSearchMetadataRef.current,
              metadata: parsed,
            };
          }
        } catch (e) {
          console.error("Error parsing morpheus-search metadata (d) JSON:", e);
        }
      }
      return;
    }
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    addToolResult,
    status,
    reload,
    stop,
    append,
  } = useChat({
    id,
    initialMessages: processedInitialMessages,
    maxSteps: 50,
    body: {
      address,
      id,
      searchType:
        initialSearchType ||
        (activeMode === "morpheus" ? "morpheus-search" : "sentinel-mode"),
    },
    streamProtocol: "data",
    onResponse: async response => {
      clearError();
      lastActionAppendedErrorRef.current = false;

      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);

        let newError: ChatError = {
          type: getErrorTypeFromStatus(response.status),
          message:
            ErrorTypeDescriptions[getErrorTypeFromStatus(response.status)],
          details: `Status: ${response.status} ${response.statusText}`,
          handled: false,
        };

        try {
          const text = await response.clone().text();
          const errorData = safeJsonParse(text);
          if (errorData.error?.includes("ToolInvocation must have a result")) {
            try {
              const toolInvocationStr = errorData.error.split(
                "ToolInvocation must have a result: "
              )[1];
              const toolInvocation = safeJsonParse(toolInvocationStr);

              newError = {
                type: ChatErrorType.PENDING_ACTION,
                message: ErrorTypeDescriptions[ChatErrorType.PENDING_ACTION],
                details: errorData.error,
                toolInvocation,
                handled: false,
              };

              setPendingToolCall(toolInvocation);
            } catch (e) {
              console.error("Error parsing tool invocation:", e);
            }
          } else if (errorData.error || errorData.message) {
            newError = {
              type: ChatErrorType.GENERIC,
              message: "An error occurred with your request.",
              details: errorData.error || errorData.message,
              handled: false,
            };
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        // Don't append PENDING_ACTION errors as messages, only show in error state
        const shouldAppendAsMessage =
          (isActionableError(newError.type) &&
            newError.type !== ChatErrorType.PENDING_ACTION) ||
          (newError.type === ChatErrorType.GENERIC && !newError.toolInvocation);

        if (
          shouldAppendAsMessage &&
          !appendedErrorIdsRef.current.has(newError.message)
        ) {
          const inlineErrorMessage: Message = {
            id: `error-inline-${generateId()}`,
            role: "assistant",
            content: newError.message,
            createdAt: new Date(),
          };
          append(inlineErrorMessage);
          appendedErrorIdsRef.current.add(newError.message);
          lastActionAppendedErrorRef.current = true;
          newError.handled = true;
        }

        setError(newError);

        if (readerRef.current) {
          try {
            readerRef.current.releaseLock();
            readerRef.current = null;
          } catch (e) {
            console.error(
              "Error releasing reader in onResponse error handler:",
              e
            );
            readerRef.current = null;
          }
        }

        if (onFinishResponse) onFinishResponse();
        return;
      }

      messageCountRef.current = messages.length;

      const clonedResponse = response.clone();
      const reader = clonedResponse.body?.getReader();
      if (reader) {
        readerRef.current = reader;
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);

              if (error.type !== ChatErrorType.NONE) {
                clearError();
              }

              await processChunk(chunk);
            }
          } catch (error: any) {
            if (
              error instanceof TypeError &&
              error.message?.includes("Releasing Default reader")
            ) {
              console.log("Reader released, stream aborted.");
            } else if (error instanceof Error && error.name === "AbortError") {
              console.log("Stream was intentionally aborted.");
            } else {
              console.error("Error reading stream:", error);

              if (
                !appendedErrorIdsRef.current.has(
                  "Network error while receiving data."
                )
              ) {
                const streamErrorMsg: Message = {
                  id: `error-stream-${generateId()}`,
                  role: "assistant",
                  content: ErrorTypeDescriptions[ChatErrorType.NETWORK],
                  createdAt: new Date(),
                };
                append(streamErrorMsg);
                appendedErrorIdsRef.current.add(
                  "Network error while receiving data."
                );
                lastActionAppendedErrorRef.current = true;

                setError({
                  type: ChatErrorType.NETWORK,
                  message: ErrorTypeDescriptions[ChatErrorType.NETWORK],
                  details: error.message,
                  handled: true,
                });
              }
            }
          } finally {
            if (readerRef.current === reader) {
              try {
                readerRef.current.releaseLock();
                readerRef.current = null;
              } catch (e) {
                console.error(
                  "Error releasing reader in stream completion:",
                  e
                );
                readerRef.current = null;
              }
            }
          }
        };
        processStream();
      } else {
        console.warn("No stream available in response");
        if (onFinishResponse) onFinishResponse();
      }
    },
    onFinish: async () => {
      try {
        if (onFinishResponse) {
          onFinishResponse();
        }

        if (readerRef.current) {
          try {
            readerRef.current.releaseLock();
            readerRef.current = null;
          } catch (e) {
            console.error("Error releasing reader in onFinish:", e);
            readerRef.current = null;
          }
        }

        setIsGenerating(false);
        isMorpheusSearchRef.current = false;
        morpheusSearchContentBufferRef.current = "";
        morpheusSearchMetadataRef.current = {};

        previousStatusRef.current = "finished";
      } catch (error) {
        console.error("Error in onFinish:", error);
      }
    },
    onError: err => {
      if (lastActionAppendedErrorRef.current) {
        return;
      }

      isMorpheusSearchRef.current = false;
      morpheusSearchContentBufferRef.current = "";
      morpheusSearchMetadataRef.current = {};

      const originalErrorMessage = err.message || "Unknown hook error";
      const userErrorMessage = ErrorTypeDescriptions[ChatErrorType.GENERIC];

      if (err.message?.includes("ToolInvocation")) {
        setError({
          type: ChatErrorType.PENDING_ACTION,
          message: ErrorTypeDescriptions[ChatErrorType.PENDING_ACTION],
          details: err.message,
          handled: true, // Mark as handled so we don't append a message
        });
      } else if (
        err.message?.toLowerCase().includes("network") ||
        err.message?.toLowerCase().includes("fetch")
      ) {
        setError({
          type: ChatErrorType.NETWORK,
          message: ErrorTypeDescriptions[ChatErrorType.NETWORK],
          details: err.message,
          handled: false,
        });
      } else if (!appendedErrorIdsRef.current.has(originalErrorMessage)) {
        const hookErrorMsg: Message = {
          id: `error-hook-${generateId()}`,
          role: "assistant",
          content: userErrorMessage,
          createdAt: new Date(),
        };
        append(hookErrorMsg);
        appendedErrorIdsRef.current.add(originalErrorMessage);
        lastActionAppendedErrorRef.current = true;

        setError({
          type: ChatErrorType.GENERIC,
          message: userErrorMessage,
          details: originalErrorMessage,
          handled: true,
        });
      }

      setIsGenerating(false);

      if (readerRef.current) {
        try {
          readerRef.current.releaseLock();
          readerRef.current = null;
        } catch (e) {
          console.error("Error releasing reader in onError:", e);
          readerRef.current = null;
        }
      }

      if (onFinishResponse) {
        onFinishResponse();
      }
    },
  });

  const saveCurrentChat = useCallback(
    async (messagesToSave: any[], isReadOnly: boolean = false) => {
      if (isReadOnly) {
        return false;
      }

      if (!id || !address || !messagesToSave.length) {
        return false;
      }

      try {
        // Get the current mode from localStorage
        let currentActiveMode: string | null = null;
        if (typeof window !== "undefined") {
          try {
            currentActiveMode = localStorage.getItem("messageMode");
          } catch (e) {
            console.error("Error accessing localStorage for mode:", e);
          }
        }

        // Track the mode of the last user message to use for assistant messages
        let lastUserMessageMode: string | null = null;

        // First pass: set mode on user messages that don't have it and track last user message mode
        for (let i = 0; i < messagesToSave.length; i++) {
          const message = messagesToSave[i];
          if (message.role === "user") {
            // Set mode on user message if it doesn't have one
            if (!message.mode) {
              message.mode =
                currentActiveMode ||
                (initialSearchType === "morpheus-search"
                  ? "morpheus"
                  : "sentinel");
            }
            lastUserMessageMode = message.mode;
          }
        }

        // Second pass: ensure all assistant messages have the same mode as their preceding user message
        const processedMessages = messagesToSave.map(message => {
          // Already processed user messages in first pass
          if (message.role === "user") {
            return message;
          }

          // For assistant messages, use the last user message mode or current mode
          if (!message.mode) {
            message.mode =
              lastUserMessageMode ||
              currentActiveMode ||
              (initialSearchType === "morpheus-search"
                ? "morpheus"
                : "sentinel");
          }

          return message;
        });

        // Create the save payload with processed messages
        const savePayload = {
          id: id,
          wallet_address: address,
          messages: processedMessages,
        };

        // Call the API
        const response = await fetch("/api/chat", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(savePayload),
        });

        const responseData = await response.json();

        if (response.ok) {
          try {
            const event = new CustomEvent("chatSaved", {
              detail: {
                success: true,
                id,
              },
            });
            window.dispatchEvent(event);
          } catch (e) {
            console.error("Error dispatching save event:", e);
          }

          return true;
        } else {
          console.error("Error saving chat:", responseData);
          return false;
        }
      } catch (error) {
        console.error("Exception during chat save:", error);
        return false;
      }
    },
    [id, address, initialSearchType]
  );

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isReady = status === "ready";
    const wasFinished = previousStatusRef.current === "finished";

    if (previousStatusRef.current !== "finished") {
      previousStatusRef.current = status;
    }

    if (isReady && (wasFinished || messages.length > messageCountRef.current)) {
      // Only save if we're not navigating away
      if (!navigatedToRootRef.current) {
        // Clear any existing timer first
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Set a new timer for delayed saving
        saveTimeoutRef.current = setTimeout(async () => {
          // Double-check we're not navigating away before saving
          if (navigatedToRootRef.current) {
            return;
          }

          if (wasFinished) {
            previousStatusRef.current = "ready";
          }

          messageCountRef.current = messages.length;
          await saveCurrentChat(messages, isReadOnly);

          // Clear timer reference after it's done
          saveTimeoutRef.current = null;
        }, 500);
      }
    }

    // Clean up the timeout when the component unmounts or dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [status, messages, saveCurrentChat, isReadOnly]);

  useEffect(() => {
    const handleRightSidebarClose = () => {
      setSelectedToolId(null);
    };

    window.addEventListener("rightSidebarClosed", handleRightSidebarClose);

    return () => {
      window.removeEventListener("rightSidebarClosed", handleRightSidebarClose);
    };
  }, []);

  useEffect(() => {
    const chatIdChanged = id !== previousChatIdRef.current;

    if (chatIdChanged) {
      setTools([]);
      setSelectedToolId(null);
      toolInvocationsRef.current = {};
      processedInvocationsRef.current.clear();
      previousChatIdRef.current = id;
    }
  }, [id, initialMessages.length]);

  useEffect(() => {
    const extractInvocations = (messages: Message[]) => {
      messages.forEach((message: any) => {
        if (message.parts) {
          message.parts.forEach((part: any) => {
            if (
              part.type === "tool-invocation" &&
              part.toolInvocation &&
              !processedInvocationsRef.current.has(
                part.toolInvocation.toolCallId
              )
            ) {
              processedInvocationsRef.current.add(
                part.toolInvocation.toolCallId
              );

              const enrichedInvocation = {
                ...part.toolInvocation,
                state: "call" as const,
                step: 0,
                message: {
                  mode: message.mode,
                },
              };

              addTool(enrichedInvocation);

              if (
                !SIDEBAR_HIDDEN_TOOLS.includes(
                  part.toolInvocation.toolName as any
                ) &&
                typeof window !== "undefined" &&
                window.location.pathname !== "/"
              ) {
                setActiveTab("tools");
                setIsRightSidebarExpanded(true);
                setSelectedToolId(part.toolInvocation.toolCallId);
              }
            }
          });
        }
      });
    };
    extractInvocations(messages);
  }, [
    messages,
    addTool,
    setActiveTab,
    setIsRightSidebarExpanded,
    setSelectedToolId,
  ]);

  const updateToolInvocations = useCallback(
    (toolCallId: string, tool: Omit<PendingToolState, "state">) => {
      const pendingTool: PendingToolState = {
        ...tool,
        state: "partial-call",
      };

      toolInvocationsRef.current = {
        ...toolInvocationsRef.current,
        [toolCallId]: pendingTool,
      };

      if (!processedInvocationsRef.current.has(toolCallId)) {
        processedInvocationsRef.current.add(toolCallId);

        const currentMode = getCurrentModeFromStorage();

        const enrichedInvocation = {
          state: "call" as const,
          step: 0,
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
          args: tool.args,
          message: {
            mode: currentMode,
          },
        };

        addTool(enrichedInvocation);

        if (
          !SIDEBAR_HIDDEN_TOOLS.includes(tool.toolName as any) &&
          typeof window !== "undefined" &&
          window.location.pathname !== "/"
        ) {
          setActiveTab("tools");
          setIsRightSidebarExpanded(true);
          setSelectedToolId(toolCallId);
        }
      }
    },
    [addTool, setActiveTab, setIsRightSidebarExpanded, setSelectedToolId]
  );

  const resetInternalState = useCallback(() => {
    setTools([]);
    setSelectedToolId(null);
    setPendingToolCall(null);
    toolInvocationsRef.current = {};
    processedInvocationsRef.current.clear();
    clearError();
    appendedErrorIdsRef.current.clear();
    lastActionAppendedErrorRef.current = false;
    setIsGenerating(false);
    isMorpheusSearchRef.current = false;
    morpheusSearchContentBufferRef.current = "";
    morpheusSearchMetadataRef.current = {};
  }, [clearError]);

  const handleToolConfirmation = React.useCallback(
    async (confirmed: boolean) => {
      clearError();

      const toolCall =
        error.type === ChatErrorType.PENDING_ACTION && error.toolInvocation
          ? error.toolInvocation
          : pendingToolCall;

      if (!toolCall) return;

      addToolResult({
        toolCallId: toolCall.toolCallId,
        result: confirmed ? "yes" : "no",
      });

      setPendingToolCall(null);
    },
    [pendingToolCall, addToolResult, error, clearError]
  );

  const handleRetry = React.useCallback(() => {
    clearError();
    lastActionAppendedErrorRef.current = false;

    if (messages.length > 0) {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find(m => m.role === "user");
      if (lastUserMessage) {
        handleInputChange({
          target: {
            value: lastUserMessage.content,
          },
        } as ChangeEvent<HTMLTextAreaElement>);
        originalHandleSubmit(
          new Event("submit") as unknown as FormEvent<HTMLFormElement>
        );
      }
    }
  }, [messages, handleInputChange, originalHandleSubmit, clearError]);

  const [currentVaultDetails, setCurrentVaultDetails] =
    React.useState<any>(null);

  const handleInputChangeWrapper = React.useCallback(
    (value: any) => {
      clearError();
      lastActionAppendedErrorRef.current = false;
      if (value.target?.vaultDetails) {
        setCurrentVaultDetails(value.target.vaultDetails);
        handleInputChange({
          target: { value: value.target.value },
        } as ChangeEvent<HTMLTextAreaElement>);
      } else {
        handleInputChange({
          target: { value },
        } as ChangeEvent<HTMLTextAreaElement>);
      }
    },
    [handleInputChange, clearError]
  );

  const createFormEvent = () => {
    return new Event("submit") as unknown as FormEvent<HTMLFormElement>;
  };

  const handleMorpheusSearchSubmit = useCallback(
    async (userInput: string, searchType: string) => {
      if (onSubmitMessage) {
        onSubmitMessage();
      }

      // Set input value
      handleInputChange({
        target: { value: userInput },
      } as ChangeEvent<HTMLTextAreaElement>);

      setIsGenerating(true);
      isMorpheusSearchRef.current = true;
      morpheusSearchContentBufferRef.current = "";
      morpheusSearchMetadataRef.current = {};

      originalHandleSubmit(createFormEvent(), {
        body: {
          searchType: searchType,
          address: address,
          id: id,
        },
      });
    },
    [originalHandleSubmit, address, id, handleInputChange, onSubmitMessage]
  );

  const wrappedHandleSubmit = useCallback(
    (
      event?:
        | React.FormEvent<HTMLFormElement>
        | React.SyntheticEvent
        | { preventDefault?: () => void },
      options?: any
    ) => {
      console.log(
        `[wrappedHandleSubmit - ID: ${id}] Called. Current status: ${status}, isGenerating: ${isGenerating}, hasPendingTools: ${hasPendingTools}`
      );
      clearError();
      lastActionAppendedErrorRef.current = false;
      navigatedToRootRef.current = false;

      const currentActiveMode = activeMode;
      const currentSearchType =
        currentActiveMode === "morpheus" ? "morpheus-search" : "sentinel-mode";

      if (currentActiveMode === "morpheus") {
        console.log(
          `[wrappedHandleSubmit - ID: ${id}] Setting isMorpheusSearchRef to true`
        );
        isMorpheusSearchRef.current = true;
        morpheusSearchContentBufferRef.current = "";
        morpheusSearchMetadataRef.current = {};
      } else {
        // Ensure it's false for sentinel submissions
        isMorpheusSearchRef.current = false;
      }

      setIsGenerating(true);
      console.log(
        `[wrappedHandleSubmit - ID: ${id}] Set isGenerating to true.`
      );
      const dynamicBody = {
        address: address,
        id: id,
        searchType: currentSearchType,
        vaultDetails: currentVaultDetails,
        ...(options?.body || {}),
      };

      console.log(
        `[wrappedHandleSubmit - ID: ${id}] Calling originalHandleSubmit with body:`,
        dynamicBody
      );
      const submitResult = originalHandleSubmit(event, {
        ...options,
        body: dynamicBody,
      });
      setCurrentVaultDetails(null);

      console.log(
        `[wrappedHandleSubmit - ID: ${id}] Called originalHandleSubmit.`
      );
      return submitResult;
    },
    [
      originalHandleSubmit,
      clearError,
      activeMode,
      address,
      id,
      setIsGenerating,
      status,
      isGenerating,
      currentVaultDetails,
    ]
  );

  const isToolPending = useCallback((toolInvocation: ToolInvocation) => {
    if (
      toolInvocation.state !== "call" &&
      toolInvocation.state !== "partial-call"
    ) {
      return false;
    }

    if (isToolAborted(toolInvocation)) {
      return false;
    }

    if (hasToolCompletedSuccessfully(toolInvocation)) {
      return false;
    }

    return true;
  }, []);

  const hasPendingTools = useMemo(() => {
    if (!messages || messages.length === 0) return false;

    return messages.some(message => {
      if (message.parts) {
        return message.parts.some(part => {
          if (part.type !== "tool-invocation" || !part.toolInvocation) {
            return false;
          }

          return isToolPending(part.toolInvocation);
        });
      }

      return false;
    });
  }, [messages, isToolPending]);

  const sendMessage = useCallback(
    (message: string, payload?: Record<string, any>) => {
      if (hasPendingTools) {
        return;
      }

      clearError();
      lastActionAppendedErrorRef.current = false;
      navigatedToRootRef.current = false;
      setIsAborting(false);

      if (onSubmitMessage) {
        onSubmitMessage();
      }

      setIsGenerating(true);
      handleInputChangeWrapper(message);
      wrappedHandleSubmit(createFormEvent(), { body: payload });
    },
    [
      wrappedHandleSubmit,
      handleInputChangeWrapper,
      onSubmitMessage,
      clearError,
      hasPendingTools,
      setIsAborting,
      setIsGenerating,
    ]
  );

  const abortSingleTool = useCallback(
    (toolId: string) => {
      addToolResult({
        toolCallId: toolId,
        result: { error: "Operation aborted by user" },
      });
    },
    [addToolResult]
  );

  const findPendingTools = useCallback((): Array<{ toolCallId: string }> => {
    const pendingTools: Array<{ toolCallId: string }> = [];

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.parts) {
        lastMessage.parts.forEach(part => {
          if (
            part.type === "tool-invocation" &&
            part.toolInvocation &&
            isToolPending(part.toolInvocation)
          ) {
            pendingTools.push({
              toolCallId: part.toolInvocation.toolCallId,
            });
          }
        });
      }
    }

    return pendingTools;
  }, [messages, tools, isToolPending]);

  const stopStream = useCallback(() => {
    stop();

    if (readerRef.current) {
      try {
        readerRef.current.releaseLock();
        readerRef.current = null;
      } catch (error) {
        console.log("Reader already released during abort", error);
      }
    }
  }, [stop]);

  const abortAllTools = useCallback(() => {
    const pendingTools = findPendingTools();

    if (pendingTools.length > 0) {
      pendingTools.forEach(tool => {
        const toolInvocation = tools.find(
          t => t.toolCallId === tool.toolCallId
        );

        const hasCompletedResult =
          toolInvocation && hasToolCompletedSuccessfully(toolInvocation);

        if (!hasCompletedResult) {
          addToolResult({
            toolCallId: tool.toolCallId,
            result: { error: "All operations aborted by user" },
          });
        }
      });
    }
  }, [findPendingTools, addToolResult, tools]);

  const cleanupAfterAbort = useCallback(() => {
    isMorpheusSearchRef.current = false;
    morpheusSearchContentBufferRef.current = "";
    morpheusSearchMetadataRef.current = {};
    previousStatusRef.current = "finished";

    clearError();

    if (id && address && messages.length > 0 && !isReadOnly) {
      saveCurrentChat(messages, isReadOnly).catch(e =>
        console.error("Error saving chat after stopping stream:", e)
      );
    }

    setIsAborting(false);
    setIsGenerating(false);

    onFinishResponse?.();
  }, [
    id,
    address,
    messages,
    isReadOnly,
    saveCurrentChat,
    clearError,
    setIsGenerating,
    onFinishResponse,
  ]);

  const abortStream = React.useCallback(() => {
    setIsAborting(true);
    abortAllTools();
    setTimeout(() => {
      stopStream();
      setTimeout(cleanupAfterAbort, 300);
    }, 100);
  }, [setIsAborting, stopStream, abortAllTools, cleanupAfterAbort]);

  const customReload = useCallback(() => {
    setIsGenerating(true);
    setIsAborting(false);

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageToolIds = new Set<string>();

      if (lastMessage.parts) {
        lastMessage.parts.forEach(part => {
          if (part.type === "tool-invocation" && part.toolInvocation) {
            lastMessageToolIds.add(part.toolInvocation.toolCallId);
          }
        });
      }

      // Remove all tool invocations from the last message
      if (lastMessageToolIds.size > 0) {
        // Update unified tools array only
        setTools(prev =>
          prev.filter(tool => !lastMessageToolIds.has(tool.toolCallId))
        );
      }
    }

    return reload();
  }, [reload, messages, setIsAborting, setIsGenerating]);

  return {
    tools,
    selectedToolId,
    setSelectedToolId,
    messages,
    input,
    isLoading: status === "streaming" || isAborting || isGenerating,
    error: {
      message: error.type !== ChatErrorType.NONE ? error.message : null,
      type: error.type !== ChatErrorType.NONE ? error.type : null,
      details: error.details,
      clear: clearError,
      isPendingAction: error.type === ChatErrorType.PENDING_ACTION,
    },
    pendingToolCall:
      error.type === ChatErrorType.PENDING_ACTION && error.toolInvocation
        ? error.toolInvocation
        : pendingToolCall,
    handleSubmit: wrappedHandleSubmit,
    handleMorpheusSearchSubmit,
    handleInputChange: handleInputChangeWrapper,
    resetInternalState,
    handleToolConfirmation,
    handleRetry,
    reload: customReload,
    addToolResult,
    morpheusSearchContent: morpheusSearchContentBufferRef.current,
    sendMessage,
    saveChat: saveCurrentChat,
    readerRef,
    abortStream,
    abortSingleTool,
    hasPendingTools,
    isAborting,
  };
}
