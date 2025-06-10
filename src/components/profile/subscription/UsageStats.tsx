import React from "react";

import { MessageSquareText } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import { UserQuota } from "@/lib/userManager";

interface UsageStatsProps {
  isPremium: boolean;
  userQuota:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
}

export const UsageStats: React.FC<UsageStatsProps> = ({
  isPremium,
  userQuota,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
      <div>
        <Label className="text-base font-medium flex items-center">
          <MessageSquareText className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
          Daily Usage
        </Label>
        <p className="text-sm text-muted-foreground mt-2">
          {isPremium
            ? "You have unlimited messages with your Premium subscription."
            : `${
                (userQuota?.dailyLimit ?? 0) - (userQuota?.usedToday || 0)
              } messages remaining today.`}
        </p>
      </div>
      <div className="w-full sm:w-1/2">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span>Today&apos;s Usage</span>
          <span>
            {userQuota?.usedToday} / {isPremium ? "∞" : userQuota?.dailyLimit}
          </span>
        </div>
        <Progress
          value={
            isPremium
              ? 100
              : Math.min(
                  100,
                  ((userQuota?.usedToday || 0) / (userQuota?.dailyLimit || 1)) *
                    100
                )
          }
          className={`h-2 ${isPremium ? "bg-gradient-to-r from-emerald-500 to-cyan-500" : ""}`}
        />
      </div>
    </div>
  );
};

export default UsageStats;
