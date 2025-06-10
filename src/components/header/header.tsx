import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LineChart, Settings } from "lucide-react";
import { useAccount } from "wagmi";

import ShareChatButton from "@/components/chat/ShareChatButton";
import { SidebarToggleButton } from "@/components/layout/sidebar-toggle-button";
import { RightPanelToggleButtons } from "@/components/right-sidebar/right-panel-toggle-buttons";
import { MatrixConnectButton } from "@/components/shared/ConnectButton";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useSplitLayout } from "@/contexts/split-layout-context";
import { TabType, useTab } from "@/contexts/tab-context";

export function Header() {
  const { isConnected } = useAccount();
  const {
    isLeftSidebarExpanded,
    isRightSidebarExpanded,
    setIsRightSidebarExpanded,
    toggleLeftSidebar,
  } = useSplitLayout();
  const pathname = usePathname();
  const [, setActiveTab] = useTab();
  const [isMobile, setIsMobile] = useState(false);

  // Check if on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isHomePage = pathname === "/";
  const isChatPage = pathname.includes("/chat");

  // Function to handle opening panels with smoother transitions
  const handleOpenTab = (tab: TabType) => {
    // Use setTimeout to let browser render the hiding of the button first
    // This prevents the flash effect
    setTimeout(() => {
      setIsRightSidebarExpanded(true);
      setActiveTab(tab);
    }, 10);
  };

  const isChatId = /^\/chat\/[a-zA-Z0-9]+$/.test(pathname);
  const showForPublicChat = !isConnected && isChatId;

  if (!isConnected && !showForPublicChat) {
    return null;
  }

  return (
    <header
      className="flex items-center justify-between gap-4 z-50 sticky top-0 left-0 right-0 border-b border-gray-100 dark:border-gray-800 md:border-b-0 pr-4 pl-2"
      style={{
        height: "55px",
        minHeight: "55px",
        maxHeight: "55px",
        boxShadow: isMobile ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      <div className="flex items-center gap-4 bg-transparent">
        {/* Left sidebar toggle on mobile (only when connected) */}
        {isConnected && (
          <div className="md:hidden">
            <SidebarToggleButton
              isMobile={true}
              onClick={toggleLeftSidebar}
              inHeader={true}
            />
          </div>
        )}

        {/* Logo - always visible */}
        <Link
          href="/"
          className={`${isConnected ? "hidden md:flex" : "flex"} items-center main-logo p-2`}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={40}
            className="dark:invert cursor-pointer transform transition-all duration-500 ease-in-out ml-[1px]"
            style={{
              opacity: isConnected && isLeftSidebarExpanded ? 0 : 1,
              visibility:
                isConnected && isLeftSidebarExpanded ? "hidden" : "visible",
              transform:
                isConnected && isLeftSidebarExpanded
                  ? "translateX(-20px) scale(0.9)"
                  : "translateX(0) scale(1)",
              transformOrigin: "left center",
            }}
          />
        </Link>
      </div>
      <div className="flex items-center gap-1">
        {/* Display mobile action buttons - only when connected */}
        {isConnected && isHomePage && !isRightSidebarExpanded && (
          <div className="md:hidden flex items-center gap-2">
            {/* News button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 cursor-pointer w-10 h-10 rounded-full",
                "hover:!bg-transparent hover:text-emerald-500 dark:hover:text-emerald-400",
                "hover:scale-105 active:scale-95 text-gray-600 dark:text-gray-300"
              )}
              onClick={() => handleOpenTab("news")}
              aria-label="News"
            >
              <LineChart className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Tab buttons on chat pages (mobile) - always visible for all chat pages */}
        {isChatPage && (
          <div className="md:hidden">
            <RightPanelToggleButtons
              onOpenTab={handleOpenTab}
              orientation="horizontal"
            />
          </div>
        )}

        {isConnected && isChatPage && pathname.includes("/chat/") && (
          <>
            <div className="hidden md:block">
              <ShareChatButton chatId={pathname.split("/chat/")[1]} />
            </div>

            <div className="md:hidden">
              <ShareChatButton chatId={pathname.split("/chat/")[1]} />
            </div>
          </>
        )}

        {/* Settings icon - only visible when connected */}
        {isConnected && (
          <Link
            href={"/profile"}
            className="hidden md:block"
            onClick={() => {
              setIsRightSidebarExpanded(false);
            }}
          >
            <div className="bg-background/90 backdrop-blur-md rounded-full border border-gray-800/20 dark:border-gray-700/40 w-8 h-8 flex items-center justify-center cursor-pointer hover:border-primary/20 transition-colors relative">
              <div className="bg-gradient-to-b from-primary/5 to-transparent absolute inset-0 rounded-full pointer-events-none opacity-50"></div>
              <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors transform hover:scale-105 active:scale-95" />
            </div>
          </Link>
        )}

        {/* ConnectKit wallet button (always visible) */}
        <div className={isConnected ? "md:block hidden" : "block"}>
          <MatrixConnectButton />
        </div>
      </div>
    </header>
  );
}
