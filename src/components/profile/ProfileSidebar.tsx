import React from "react";

import { Bell, CreditCard, Globe, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { UserQuota } from "@/lib/userManager";

import UsageStats from "./UsageStats";

interface ProfileSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  address: string | undefined;
  userQuota:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
}

const ProfileSidebar = ({
  activeTab,
  setActiveTab,
  address,
  userQuota,
}: ProfileSidebarProps) => {
  // Format wallet address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="hidden md:block space-y-6">
      <Card className="mb-2">
        <CardContent className="p-6">
          <div className="mb-8">
            <Label className="text-xs text-muted-foreground mb-4 block">
              CONNECTED AS
            </Label>
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {address?.substring(2, 4)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-mono text-sm mb-2">
                  {formatAddress(address || "")}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    userQuota?.isPremium
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                      : ""
                  }`}
                >
                  {userQuota?.isPremium ? "Premium Member" : "Free Tier"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground mb-2 block">
              SETTINGS
            </Label>
            <Button
              variant={activeTab === "general" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("general")}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>General</span>
            </Button>
            <Button
              variant={activeTab === "subscription" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("subscription")}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              <span>Subscription</span>
            </Button>
            <Button
              variant={activeTab === "account" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("account")}
            >
              <User className="h-4 w-4 mr-2" />
              <span>Account</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              <Bell className="h-4 w-4 mr-2" />
              <span>Notifications</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              <Globe className="h-4 w-4 mr-2" />
              <span>Language</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats Card - on sidebar for larger screens */}
      <Card>
        <CardContent className="p-5">
          <UsageStats userQuota={userQuota} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
