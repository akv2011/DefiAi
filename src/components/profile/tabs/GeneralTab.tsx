import React from "react";

import { Calendar, Crown, MessageSquareText } from "lucide-react";

import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { UserQuota } from "@/lib/userManager";

import { useUser } from "@/contexts/user-context";

interface SubscriptionState {
  active: boolean;
  plan: string;
  status: "active" | "canceled" | "past_due" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string | null;
}

interface GeneralTabProps {
  setActiveTab: (tab: string) => void;
  userQuota:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
  subscription: SubscriptionState;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  setActiveTab,
  userQuota,
  subscription,
}) => {
  const { isPremium } = useUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Dashboard</CardTitle>
        <CardDescription>
          Overview of your account usage and subscription status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Status */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
          <div>
            <Label className="text-base font-medium flex items-center">
              {isPremium ? (
                <>
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  Current Subscription
                </>
              ) : (
                <>
                  <MessageSquareText className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                  Subscription Status
                </>
              )}
            </Label>
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                {isPremium ? (
                  <>
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                    >
                      Premium
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {subscription.plan || "Premium"}
                    </p>
                  </>
                ) : (
                  <>
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                    >
                      Free Tier
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Limited features
                    </p>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isPremium
                  ? subscription.cancel_at_period_end
                    ? `Your subscription ends on ${
                        subscription.current_period_end
                          ? new Date(
                              subscription.current_period_end
                            ).toLocaleDateString()
                          : "N/A"
                      }`
                    : `Your subscription renews on ${
                        subscription.current_period_end
                          ? new Date(
                              subscription.current_period_end
                            ).toLocaleDateString()
                          : "N/A"
                      }`
                  : "Upgrade to access premium features"}
              </p>
            </div>
          </div>
          {isPremium ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 sm:mt-0"
              onClick={() => setActiveTab("subscription")}
            >
              Manage Subscription
            </Button>
          ) : (
            <SubscriptionDialog
              buttonSize="sm"
              buttonClassName="mt-4 sm:mt-0 shadow-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
              buttonText="Upgrade Now"
              source="general_tab_subscription_section"
            />
          )}
        </div>

        <Separator className="my-4" />

        {/* Usage Stats */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
          <div>
            <Label className="text-base font-medium flex items-center">
              <MessageSquareText className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Message Usage
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
                {userQuota?.usedToday} /{" "}
                {isPremium ? "∞" : userQuota?.dailyLimit}
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Progress
                    value={
                      isPremium
                        ? 100
                        : Math.min(
                            100,
                            ((userQuota?.usedToday || 0) /
                              (userQuota?.dailyLimit || 1)) *
                              100
                          )
                    }
                    className={`h-2 ${
                      isPremium
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                        : ""
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {isPremium
                    ? "Unlimited messages with Premium"
                    : `${userQuota?.usedToday || 0} of ${userQuota?.dailyLimit} messages used`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Total Messages */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
          <div>
            <Label className="text-base font-medium flex items-center">
              <MessageSquareText className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Total Messages
            </Label>
            <p className="text-sm text-muted-foreground mt-2">
              Lifetime message count
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg shadow-sm flex items-center">
            <MessageSquareText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-3" />
            <p className="text-xl font-bold">
              {userQuota?.totalMessages?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Reset Schedule */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
          <div>
            <Label className="text-base font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
              Reset Schedule
            </Label>
            <p className="text-sm text-muted-foreground mt-2">
              Your message quota resets daily at midnight UTC
            </p>
          </div>
          <div className="w-full sm:w-1/2">
            <Alert className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <AlertDescription className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                Next reset:{" "}
                <span className="font-medium ml-1">Today at midnight UTC</span>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralTab;
