import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ToolInvocation, generateId } from "ai";
import { useAccount } from "wagmi";

import { supabaseReadOnly } from "@/lib/supabaseClient";

import { useUnifiedChat } from "@/hooks/useUnifiedChat";

import { useSplitLayout } from "@/contexts/split-layout-context";

type UnifiedChatReturn = ReturnType<typeof useUnifiedChat>;

interface AssistantMessagePayload {
  id: string;
  content: string;
}

export type MessageMode = "morpheus" | "sentinel";

interface ChatContextType extends UnifiedChatReturn {
  // Explicitly listing properties from UnifiedChatReturn for clarity
  tools: ToolInvocation[];
  selectedToolId: string | null;
  setSelectedToolId: React.Dispatch<React.SetStateAction<string | null>>;

  // Rest of the context properties
  resetChat: () => void;
  loadChat: (
    id: string,
    messages: any[],
    title?: string,
    readOnly?: boolean
  ) => void;
  chatId: string;
  chatTitle: string;
  addAssistantMessage: (payload: AssistantMessagePayload) => void;
  activeMode: MessageMode;
  setActiveMode: (mode: MessageMode) => void;
  isPendingResponse: boolean;
  isTransitioningChats: boolean;
  setIsTransitioningChats: React.Dispatch<React.SetStateAction<boolean>>;
  initializeChat: (chatId: string) => Promise<void>;
  setInitialMessage: (message: string, mode?: MessageMode) => void;
  abortStream: () => void;
  abortSingleTool: (toolCallId: string) => void;
  handleNavigation: (destination?: string) => void;
  handleNavigateToRoot: () => void;
  isReadOnly: boolean;
  chatNotFound: boolean;
  isPublic: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);
interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [chatId, setChatId] = useState<string>(() => generateId());
  const [chatTitle, setChatTitle] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const { address } = useAccount();
  const [isPendingResponse, setIsPendingResponse] = useState(false);
  const [isTransitioningChats, setIsTransitioningChats] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [chatNotFound, setChatNotFound] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [initialMessageData, setInitialMessageData] = useState<{
    message: string;
    mode: MessageMode;
  } | null>(null);

  const [activeMode, setActiveMode] = useState<MessageMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedMode = localStorage.getItem("messageMode");
        if (storedMode === "morpheus" || storedMode === "sentinel") {
          return storedMode as MessageMode;
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e);
      }
    }
    return "morpheus"; // Default mode
  });

  const setMode = useCallback((mode: MessageMode) => {
    setActiveMode(mode);
    try {
      localStorage.setItem("messageMode", mode);
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  }, []);

  const { registerChatIdListener, closeRightSidebar } = useSplitLayout();

  const resetInternalStateRef = useRef<(() => void) | null>(null);
  const memoizedMessages = useMemo(() => messages, [messages]);

  const addAssistantMessage = useCallback(
    (payload: AssistantMessagePayload) => {
      const newMessage = {
        id: payload.id,
        role: "assistant",
        content: payload.content,
        mode: activeMode,
      };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, { ...newMessage }];
        return updatedMessages;
      });
    },
    [activeMode]
  );

  const chatData = useUnifiedChat({
    id: chatId,
    address,
    initialMessages: memoizedMessages,
    searchType: activeMode === "morpheus" ? "morpheus-search" : "sentinel-mode",
    isReadOnly,
    addAssistantMessageFromContext: addAssistantMessage,
    onSubmitMessage: () => setIsPendingResponse(true),
    onFinishResponse: () => setIsPendingResponse(false),
    activeMode,
  });

  useEffect(() => {
    if (chatData.isAborting || chatData.hasPendingTools) {
      setIsPendingResponse(true);
    } else if (
      !chatData.isLoading &&
      !chatData.isAborting &&
      !chatData.hasPendingTools
    ) {
      setIsPendingResponse(false);
    }
  }, [chatData.isAborting, chatData.hasPendingTools, chatData.isLoading]);

  resetInternalStateRef.current = chatData.resetInternalState;

  /**
   * Centralized chat reset function
   * Creates a completely fresh chat with a new ID
   */
  const resetChat = useCallback(() => {
    // 1. Abort any ongoing streams
    if (chatData.readerRef?.current) {
      try {
        chatData.readerRef.current.releaseLock();
        chatData.readerRef.current = null;
      } catch (error) {
        console.log("Stream already cleaned up:", error);
      }
    }

    // 2. Reset UI state
    setIsPendingResponse(false);
    setIsReadOnly(false);
    setChatNotFound(false);
    setIsPublic(false);
    closeRightSidebar();

    // 3. Create a new chat with fresh ID
    const newId = generateId();
    setChatId(newId);
    setChatTitle("");
    setMessages([]);

    // 4. Clear all context data
    setInitialMessageData(null);
    loadedChatRef.current = null;

    // 5. Reset internal state
    if (resetInternalStateRef.current) {
      resetInternalStateRef.current();
    }

    return newId; // Return the new ID for convenience
  }, [closeRightSidebar, chatData.readerRef, setIsPendingResponse]);

  const loadChat = useCallback(
    (
      id: string,
      initialMessages: any[],
      title?: string,
      readOnly?: boolean
    ) => {
      setChatId(id);
      setMessages(initialMessages);
      if (title) setChatTitle(title);
      setIsReadOnly(!!readOnly);
    },
    []
  );

  // Register chatId with the layout context to track changes
  useEffect(() => {
    registerChatIdListener(chatId);
  }, [chatId, registerChatIdListener]);

  // We no longer need this ref since we now always load chat data
  // const initialMessageProcessedRef = useRef(new Set<string>());

  // Set the initial message in context (to be used when navigating to chat page)
  const setInitialMessage = useCallback(
    (message: string, mode?: MessageMode) => {
      if (message && message.trim()) {
        setInitialMessageData({
          message: message.trim(),
          mode: mode || activeMode,
        });
      }
    },
    [activeMode]
  );

  // Track currently loaded chat to prevent redundant loading
  const loadedChatRef = useRef<string | null>(null);

  /**
   * Centralized chat initialization function that handles:
   * 1. Loading existing chats
   * 2. Handling initial messages
   * 3. Avoiding redundant loads
   */
  const initializeChat = useCallback(
    async (chatId: string) => {
      try {
        // Skip redundant initialization for the same chat
        if (loadedChatRef.current === chatId) {
          return;
        }

        console.log(`Initializing chat: ${chatId}`);
        loadedChatRef.current = chatId;

        // Get initial message from context (if any)
        const contextInitialMessage = initialMessageData?.message || null;
        const contextInitialMode = initialMessageData?.mode || activeMode;

        // Set correct mode if initial message exists
        if (contextInitialMessage && contextInitialMode) {
          setMode(contextInitialMode);
        }

        let chatDataFromDb;

        if (address) {
          const { data, error } = await supabaseReadOnly
            .from("saved_chats")
            .select("*")
            .eq("id", chatId)
            .eq("wallet_address", address);

          if (error) throw error;

          if (data && data.length > 0) {
            chatDataFromDb = data;
          }
        }

        // If not found and user is logged in, check if it's a public chat
        if (!chatDataFromDb) {
          const { data, error } = await supabaseReadOnly
            .from("saved_chats")
            .select("*")
            .eq("id", chatId)
            .eq("is_public", true);

          if (error) throw error;
          chatDataFromDb = data;
        }

        // If no data at all, try the direct API to bypass RLS policies
        if (!chatDataFromDb || chatDataFromDb.length === 0) {
          try {
            const response = await fetch(`/api/chats/public/${chatId}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                chatDataFromDb = [result.data];
              }
            }
          } catch (fetchError) {
            console.error("Error fetching public chat:", fetchError);
          }
        }

        // Set up chat data
        let chatMessages = [];
        let chatTitle = "New Chat";
        let isReadOnly = false;
        let chatIsPublic = false;

        if (chatDataFromDb && chatDataFromDb.length > 0) {
          const chat = chatDataFromDb[0];
          chatMessages = chat.messages || [];
          chatTitle = chat.label || "New Chat";
          chatIsPublic = !!chat.is_public;

          // Set the public status
          setIsPublic(chatIsPublic);

          // Set read-only if:
          // 1. It's a public chat AND user is not the owner (if logged in)
          // 2. OR user is not logged in at all (address is undefined)
          isReadOnly =
            chatIsPublic && (!address || chat.wallet_address !== address);
          setChatNotFound(false);
        } else {
          setChatNotFound(true);
          setIsPublic(false);
        }

        // Handle initial message if present
        if (contextInitialMessage) {
          const initialUserMessage = {
            id: `msg-user-${Date.now()}`,
            role: "user",
            content: contextInitialMessage,
            mode: contextInitialMode,
          };

          // Add to messages and load chat
          setMessages(prevMessages => [...prevMessages, initialUserMessage]);
          loadChat(chatId, [...chatMessages, initialUserMessage], chatTitle);

          // Clear initial message data and submit for AI response using the hook's chatData
          setInitialMessageData(null);
          chatData.handleSubmit(new Event("submit") as any); // Use hook's chatData
        } else {
          // Just load existing chat
          loadChat(chatId, chatMessages, chatTitle, isReadOnly);
        }
        setIsTransitioningChats(false);
      } catch (error) {
        console.error("Error initializing chat:", error);
        loadChat(chatId, [], "New Chat", false);
        setInitialMessageData(null);
        setIsTransitioningChats(false);
      }
    },
    [
      loadChat,
      setMode,
      setMessages,
      initialMessageData,
      activeMode,
      address,
      chatData, // Add hook's chatData to dependencies
    ]
  );

  const isHandlingNavigationRef = useRef(false);

  // Centralized navigation handler that manages all navigation-related actions
  const handleNavigation = useCallback(
    (destination: string = "/") => {
      if (isHandlingNavigationRef.current) {
        return;
      }

      isHandlingNavigationRef.current = true;
      console.log(`Navigation to ${destination} detected in chat context`);

      const isNavigatingToRoot = destination === "/";

      try {
        // 1. Reset chat state if navigating to root
        if (isNavigatingToRoot) {
          resetChat();
        }

        // 2. Stop any active stream and save chat data
        if (isPendingResponse && chatData.abortStream) {
          console.log("Stopping active stream during navigation");
          chatData.abortStream();
        }
      } finally {
        setTimeout(() => {
          isHandlingNavigationRef.current = false;
        }, 100);
      }
    },
    [isPendingResponse, chatData, resetChat]
  );

  // Keep the old function name for backward compatibility
  const handleNavigateToRoot = useCallback(() => {
    handleNavigation("/");
  }, [handleNavigation]);

  const contextValue = useMemo(
    () => ({
      ...chatData,
      chatId,
      chatTitle,
      resetChat,
      loadChat,
      addAssistantMessage,
      activeMode,
      setActiveMode: setMode,
      handleSubmit: chatData.handleSubmit,
      isPendingResponse,
      isTransitioningChats,
      setIsTransitioningChats,
      initializeChat,
      setInitialMessage,
      handleNavigation,
      handleNavigateToRoot,
      isReadOnly,
      chatNotFound,
      isPublic,
    }),
    [
      chatData,
      chatId,
      chatTitle,
      resetChat,
      loadChat,
      addAssistantMessage,
      activeMode,
      setMode,
      isPendingResponse,
      isTransitioningChats,
      setIsTransitioningChats,
      initializeChat,
      setInitialMessage,
      handleNavigation,
      handleNavigateToRoot,
      isReadOnly,
      chatNotFound,
      isPublic,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  // const context = useContext(ChatContext);
  const context = useContext(
    ChatContext as React.Context<ChatContextType | null>
  );
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
