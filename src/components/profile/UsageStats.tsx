import React from "react";

import { MessageSquareText } from "lucide-react";

import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { UserQuota } from "@/lib/userManager";

interface UsageStatsProps {
  userQuota:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
}

const UsageStats = ({ userQuota }: UsageStatsProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-xs text-muted-foreground mb-4 block">
        USAGE STATISTICS
      </Label>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-muted-foreground">Today</div>
          <div className="text-sm font-medium">
            {userQuota?.usedToday} /{" "}
            {userQuota?.isPremium ? "∞" : userQuota?.dailyLimit}
          </div>
        </div>
        <Progress
          value={
            userQuota?.isPremium
              ? 100
              : Math.min(
                  100,
                  ((userQuota?.usedToday || 0) / (userQuota?.dailyLimit || 1)) *
                    100
                )
          }
          className={`h-2 ${
            userQuota?.isPremium
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
              : ""
          }`}
        />
      </div>

      <div className="pt-2">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center">
            <MessageSquareText className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Total Messages</span>
          </div>
          <div>{userQuota?.totalMessages?.toLocaleString() || 0}</div>
        </div>
      </div>

      {!userQuota?.isPremium && (
        <>
          <Separator className="my-4" />
          <SubscriptionDialog
            buttonVariant="outline"
            buttonSize="sm"
            buttonText="Upgrade to Premium"
            buttonClassName="w-full"
            source="profile_usage_stats"
          />
        </>
      )}
    </div>
  );
};

export default UsageStats;
