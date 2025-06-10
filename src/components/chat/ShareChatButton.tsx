import React, { useEffect, useState } from "react";

import { AlertCircle, Check, Copy, Globe, Lock, Share2 } from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";

import { useChat } from "@/contexts/chat-context";
import { useTheme } from "@/contexts/theme-context";

interface ShareChatButtonProps {
  chatId: string;
}

export default function ShareChatButton({ chatId }: ShareChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [localIsPublic, setLocalIsPublic] = useState(false);
  const [shareSummary, setShareSummary] = useState("");
  const [publicChatLink, setPublicChatLink] = useState("");
  const { address } = useAccount();
  const { toast } = useToast();
  const { isReadOnly, isPublic, initializeChat } = useChat();
  const { theme } = useTheme();

  useEffect(() => {
    setLocalIsPublic(isPublic);
  }, [isPublic]);

  if (isReadOnly) return null;

  const handleToggleShare = async () => {
    try {
      const newState = !localIsPublic;
      setLocalIsPublic(newState); // Optimistic update

      // If unpublishing, clear summary/link immediately so buttons disable
      if (!newState) {
        setShareSummary("");
        setPublicChatLink("");
      }

      toast({
        title: "Processing...",
        description: newState
          ? "Making your chat public..."
          : "Making your chat private...",
        variant: "default",
      });

      setIsPublishing(true);

      const response = await fetch(`/api/chats/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: chatId,
          wallet_address: address,
          publish: newState,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        setLocalIsPublic(!newState); // Rollback optimistic update
        if (newState) {
          setShareSummary("");
          setPublicChatLink("");
        }
        toast({
          title: "Error",
          description:
            responseData.error ||
            "Failed to update chat visibility. Please try again.",
          variant: "destructive",
        });
        throw new Error(
          responseData.error || "Failed to update chat visibility"
        );
      }

      if (newState && responseData.data) {
        setShareSummary(responseData.data.share_summary || "");
        setPublicChatLink(responseData.data.public_chat_link || "");
        toast({
          title: "Chat Published",
          description: "Your chat is now publicly visible.",
          variant: "default",
        });
      } else if (!newState) {
        // Already cleared summary/link above
        toast({
          title: "Chat Made Private",
          description: "Your chat is now private.",
          variant: "default",
        });
      }

      await initializeChat(chatId);
    } catch (error) {
      console.error("Failed to toggle chat visibility:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    const urlToCopy = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard.writeText(urlToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);

    toast({
      title: "Link Copied",
      description: "Chat link copied to clipboard",
      variant: "default",
    });
  };

  const handleSocialShare = (
    platform: "twitter" | "reddit" | "linkedin" | "telegram"
  ) => {
    const currentPublicLink = `${window.location.origin}/chat/${chatId}`;

    if (!shareSummary) {
      toast({
        title: "Error",
        description:
          "Shareable summary not available yet. Please ensure the chat is public and summary is generated.",
        variant: "destructive",
      });
      return;
    }

    const encodedLink = encodeURIComponent(currentPublicLink);
    const encodedSummary = encodeURIComponent(shareSummary);
    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedSummary}&url=${encodedLink}`;
        break;
      case "reddit":
        shareUrl = `https://www.reddit.com/submit?url=${encodedLink}&title=${encodedSummary}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedLink}&text=${encodedSummary}`;
        break;
    }
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const socialButtonsDisabled =
    !localIsPublic || !shareSummary || !publicChatLink;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full w-8 h-8 relative",
            localIsPublic
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          <Share2 className="h-4 w-4" />
          {localIsPublic && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 sm:w-80 p-4" align="end" sideOffset={5}>
        <div className="space-y-6">
          <div className="flex flex-col space-y-2 mb-2">
            <h3 className="font-medium text-sm mb-1">Share Chat</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Make this chat accessible to others
            </p>
          </div>

          <div className="flex items-center justify-between space-x-6">
            <div className="flex items-center space-x-3">
              {localIsPublic ? (
                <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
              <Label htmlFor="share-mode" className="ml-2 text-sm">
                {localIsPublic ? "Public" : "Private"}
              </Label>
            </div>
            <Switch
              id="share-mode"
              checked={localIsPublic}
              onCheckedChange={handleToggleShare}
              disabled={isPublishing}
            />
          </div>

          {localIsPublic && (
            <>
              <div className="mt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="mt-2">
                  <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/chat/${chatId}`}
                      className="w-full h-9 bg-transparent px-3 py-1 text-xs sm:text-sm focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-2 rounded-l-none"
                      onClick={handleCopyLink}
                    >
                      {copySuccess ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 rounded p-2 mt-2 text-xs text-amber-800 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <p>Anyone with the link can view this chat.</p>
              </div>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center sm:text-left">
              Share this chat on:
            </p>
            <div className="grid grid-cols-4 gap-2 items-start justify-items-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50"
                onClick={() => handleSocialShare("twitter")}
                aria-label="Share on X"
                disabled={socialButtonsDisabled}
              >
                <img
                  src="/Share-logos/icons8-x.svg"
                  alt="X logo"
                  className={cn(
                    "h-7 w-7",
                    theme === "dark" && "brightness-0 invert"
                  )}
                />
                <span className="mt-1.5 text-xs text-gray-700 dark:text-gray-300">
                  X
                </span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50"
                onClick={() => handleSocialShare("reddit")}
                aria-label="Share on Reddit"
                disabled={socialButtonsDisabled}
              >
                <img
                  src="/Share-logos/4102592_applications_media_reddit_social_icon.svg"
                  alt="Reddit logo"
                  className="h-7 w-7"
                />
                <span className="mt-1.5 text-xs text-gray-700 dark:text-gray-300">
                  Reddit
                </span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50"
                onClick={() => handleSocialShare("linkedin")}
                aria-label="Share on LinkedIn"
                disabled={socialButtonsDisabled}
              >
                <img
                  src="/Share-logos/icons8-linkedin-100.svg"
                  alt="LinkedIn logo"
                  className="h-7 w-7"
                />
                <span className="mt-1.5 text-xs text-gray-700 dark:text-gray-300">
                  LinkedIn
                </span>
              </Button>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50"
                onClick={() => handleSocialShare("telegram")}
                aria-label="Share on Telegram"
                disabled={socialButtonsDisabled}
              >
                <img
                  src="/Share-logos/icons8-telegram.svg"
                  alt="Telegram logo"
                  className="h-7 w-7"
                />
                <span className="mt-1.5 text-xs text-gray-700 dark:text-gray-300">
                  Telegram
                </span>
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
