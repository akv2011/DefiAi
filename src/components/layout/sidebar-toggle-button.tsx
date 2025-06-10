import React from "react";

import { usePathname } from "next/navigation";

import { Menu, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

interface SidebarToggleButtonProps {
  isMobile: boolean;
  onClick: () => void;
  inHeader?: boolean;
}

export function SidebarToggleButton({
  isMobile,
  onClick,
  inHeader = false,
}: SidebarToggleButtonProps) {
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile";

  // Hide mobile toggle completely on profile page when not in header
  if (isMobile && isProfilePage && !inHeader) {
    return null;
  }

  // If the button is in the header, we don't want to apply the absolute positioning
  // Since the header positioning will take care of it
  const mobileClasses = inHeader
    ? "h-9 w-9 rounded-full"
    : "absolute left-4 top-1 md:hidden z-50";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "p-0 cursor-pointer",
        isMobile ? mobileClasses : "w-12 h-12"
      )}
      onClick={onClick}
    >
      {isMobile ? (
        <Menu className="h-5 w-5" />
      ) : (
        <PanelLeftOpen className="h-6 w-6" />
      )}
    </Button>
  );
}
