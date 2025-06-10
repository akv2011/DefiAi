import React, { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  Globe,
  Loader2,
  Lock,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import { useAccount } from "wagmi";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";

import { useChat } from "@/contexts/chat-context";

import { SavedMessage } from "@/types/chat";

interface MessageItemProps {
  message: SavedMessage;
  isSelected: boolean;
  onClick: () => void;
  onDeleteSuccess: () => void;
}

export function MessageItem({
  message,
  isSelected,
  onClick,
  onDeleteSuccess,
}: MessageItemProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const { chatId, setIsTransitioningChats } = useChat();
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isPublishing, setIsPublishing] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(
        `/api/chats?id=${encodeURIComponent(
          message.id
        )}&walletAddress=${encodeURIComponent(address!)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete chat");
      }

      onDeleteSuccess();
      setShowDeleteAlert(false);

      if (message.id === chatId) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete chat"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setIsPublishing(true);

      const response = await fetch(`/api/chats/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: message.id,
          wallet_address: address,
          publish: !message.is_public,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update chat visibility");
      }

      onDeleteSuccess();
      setDropdownOpen(false);
    } catch (error) {
      console.error("Failed to update chat visibility:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update chat visibility",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="w-full">
        <div
          onClick={() => {
            setIsTransitioningChats(true);
            window.dispatchEvent(new CustomEvent("rightSidebarClosed"));
            onClick();
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setDropdownOpen(false);
          }}
          className={`w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-emerald-100 dark:hover:bg-primary/20 text-left cursor-pointer transition-colors duration-200
            ${
              isSelected
                ? "bg-emerald-50 dark:bg-primary/10 border-l-2 border-emerald-500/90 dark:border-primary/90"
                : "border-l-2 border-transparent"
            }`}
          data-testid={`saved-message-${message.id}`}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              setIsTransitioningChats(true);
              window.dispatchEvent(new CustomEvent("rightSidebarClosed"));
              onClick();
            }
          }}
        >
          <div className="flex items-center w-full gap-2 min-w-0">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex items-center text-sm text-gray-700 dark:text-white w-full">
                {message.is_public && (
                  <Globe className="h-3 w-3 text-emerald-500 dark:text-primary flex-shrink-0 mr-1" />
                )}
                <span className="truncate">{message.label}</span>
              </div>
            </div>
            <div
              className={`flex-shrink-0 transition-opacity duration-200 ${
                isSelected || isHovered ? "opacity-100" : "opacity-0"
              }`}
              onClick={e => e.stopPropagation()}
              ref={dropdownRef}
            >
              <div
                className={`p-1.5 ${
                  dropdownOpen
                    ? "bg-gray-100 dark:bg-gray-800 shadow-sm"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                } rounded-md transition-all cursor-pointer inline-flex items-center justify-center`}
                onClick={e => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                role="button"
                tabIndex={0}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }
                }}
                style={{
                  backdropFilter: "blur(4px)",
                }}
              >
                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>

              {dropdownOpen && (
                <div
                  className="absolute z-50 right-0 mt-[-4px] w-48 rounded-lg shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100"
                  style={{
                    transform: "translateY(8px)",
                    maxWidth: "calc(100vw - 24px)",
                  }}
                >
                  <div
                    className="py-1.5"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* Publish/Unpublish option */}
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-primary/10 flex items-center transition-colors duration-150 font-medium cursor-pointer gap-3"
                      onClick={e => {
                        e.stopPropagation();
                        handleTogglePublish();
                      }}
                      disabled={isPublishing}
                      role="menuitem"
                    >
                      {isPublishing ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        </div>
                      ) : (
                        <>
                          {message.is_public ? (
                            <>
                              <Lock className="h-4 w-4 flex-shrink-0 text-emerald-500 dark:text-primary" />
                              <span>Make private</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 flex-shrink-0 text-emerald-500 dark:text-primary" />
                              <span>Publish chat</span>
                            </>
                          )}
                        </>
                      )}
                    </button>

                    {/* Share option - only visible when published */}
                    {message.is_public && (
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-primary/10 flex items-center transition-colors duration-150 font-medium cursor-pointer gap-3"
                        onClick={e => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/chat/${message.id}`;
                          navigator.clipboard.writeText(url);
                          setDropdownOpen(false);

                          toast({
                            title: "Link Copied",
                            description:
                              "Chat link has been copied to clipboard",
                            variant: "default",
                          });
                        }}
                        role="menuitem"
                      >
                        <Share2 className="h-4 w-4 flex-shrink-0 text-emerald-500 dark:text-primary" />
                        <span>Copy share link</span>
                      </button>
                    )}

                    {/* Delete option */}
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors duration-150 font-medium cursor-pointer gap-3"
                      onClick={e => {
                        e.stopPropagation();
                        setShowDeleteAlert(true);
                        setDropdownOpen(false);
                      }}
                      role="menuitem"
                    >
                      <Trash2 className="h-4 w-4 flex-shrink-0" />
                      <span>Delete chat</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <AlertDialogTitle className="text-center mt-4">
              Delete Chat
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-500 dark:text-gray-400">
              This will permanently delete your chat history.
              <br />
              This action cannot be undone.
              {error && (
                <div className="mt-2 text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="mt-2 sm:mt-0 w-full sm:w-auto border-gray-200/60 hover:bg-gray-100 dark:border-gray-800/40 dark:hover:bg-gray-800 cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </div>
              ) : (
                "Delete Chat"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
