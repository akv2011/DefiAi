import React from "react";

import {
  Calendar,
  CreditCard,
  Crown,
  Loader2,
  MessageSquareText,
} from "lucide-react";

import { SubscriptionDialog } from "@/components/subscription/SubscriptionDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";

import { UserQuota } from "@/lib/userManager";

import { useUser } from "@/contexts/user-context";

import { StatusMessages } from "../shared/StatusMessages";
import { PremiumBenefits } from "../subscription/PremiumBenefits";
import { UsageStats } from "../subscription/UsageStats";

interface SubscriptionState {
  active: boolean;
  plan: string;
  status: "active" | "canceled" | "past_due" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string | null;
}

interface SubscriptionTabProps {
  userQuota:
    | (UserQuota & {
        totalMessages?: number;
      })
    | null;
  subscription: SubscriptionState;
  address: string | undefined;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({
  userQuota,
  subscription,
  address,
}) => {
  const { isPremium } = useUser();
  const [loading, setLoading] = React.useState<{
    cancel: boolean;
    reactivate: boolean;
    changePlan: boolean;
  }>({
    cancel: false,
    reactivate: false,
    changePlan: false,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Reset messages when changing actions
  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Handle cancellation
  const handleCancelSubscription = async () => {
    resetMessages();
    setLoading({
      ...loading,
      cancel: true,
    });

    try {
      if (!address || !subscription.stripe_subscription_id) {
        throw new Error("Missing subscription ID or wallet address");
      }

      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Update local state to reflect cancellation
      subscription.cancel_at_period_end = true;

      setSuccess(
        "Your subscription has been canceled and will end on " +
          new Date(data.currentPeriodEnd).toLocaleDateString()
      );
    } catch (err: any) {
      console.error("Error canceling subscription:", err);
      setError(
        err.message || "An error occurred while canceling your subscription"
      );
    } finally {
      setLoading({
        ...loading,
        cancel: false,
      });
    }
  };

  // Handle reactivation
  const handleReactivateSubscription = async () => {
    resetMessages();
    setLoading({
      ...loading,
      reactivate: true,
    });

    try {
      if (!address || !subscription.stripe_subscription_id) {
        throw new Error("Missing subscription ID or wallet address");
      }

      const response = await fetch("/api/stripe/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reactivate subscription");
      }

      // Update local state to reflect reactivation
      subscription.cancel_at_period_end = false;

      setSuccess("Your subscription has been reactivated successfully");
    } catch (err: any) {
      console.error("Error reactivating subscription:", err);
      setError(
        err.message || "An error occurred while reactivating your subscription"
      );
    } finally {
      setLoading({
        ...loading,
        reactivate: false,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Settings</CardTitle>
        <CardDescription>
          Manage your Matrix Terminal subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Combined Subscription Info - Improved Layout */}
          <div className="bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-800/20 dark:to-transparent rounded-lg p-6 border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center mb-5">
              <Crown className="h-5 w-5 mr-2.5 text-amber-500" />
              <h3 className="text-base font-medium">
                Subscription Information
              </h3>
            </div>

            {isPremium ? (
              <div className="grid gap-5">
                {/* Current Plan */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Plan</p>
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 mr-2"
                      >
                        Premium
                      </Badge>
                      <span className="text-sm">
                        {subscription.plan || "Premium"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium mb-2">Status</p>
                    <div>
                      <Badge
                        variant="outline"
                        className={`${
                          subscription.cancel_at_period_end
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                        }`}
                      >
                        {subscription.cancel_at_period_end
                          ? "Ending"
                          : "Active"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Payment Info */}
                  <div>
                    <p className="text-sm font-medium mb-2">Payment Method</p>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">Visa ending in 4242</span>
                    </div>
                  </div>

                  {/* Renewal Info */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      {subscription.cancel_at_period_end
                        ? "Ending On"
                        : "Renews On"}
                    </p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        {subscription.current_period_end
                          ? new Date(
                              subscription.current_period_end
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Plan</p>
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 mr-2"
                      >
                        Free Tier
                      </Badge>
                    </div>
                  </div>
                  <SubscriptionDialog
                    buttonSize="sm"
                    buttonClassName="shadow-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
                    buttonText="Upgrade Now"
                    source="subscription_tab_header"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">
                    Daily Message Limit
                  </p>
                  <div className="flex items-center">
                    <MessageSquareText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      {userQuota?.dailyLimit} messages per day
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Subscription Actions */}
          {isPremium && (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 py-2">
                <div>
                  <Label className="text-base font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                    Subscription Actions
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Manage your premium subscription
                  </p>
                </div>
                {subscription.cancel_at_period_end ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300 dark:border-emerald-800 dark:hover:border-emerald-700 mt-4 sm:mt-0"
                    onClick={handleReactivateSubscription}
                    disabled={loading.reactivate}
                  >
                    {loading.reactivate && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reactivate Subscription
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 mt-4 sm:mt-0"
                        onClick={resetMessages}
                      >
                        Cancel Subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Cancel Subscription?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Your subscription will remain active until the end of
                          your current billing period on{" "}
                          <span className="font-medium">
                            {subscription.current_period_end
                              ? new Date(
                                  subscription.current_period_end
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                          .
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm my-2">
                          {error}
                        </div>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          disabled={loading.cancel}
                          className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                        >
                          {loading.cancel && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <Separator className="my-4" />
            </>
          )}

          {/* Usage Info */}
          <UsageStats isPremium={isPremium} userQuota={userQuota} />

          {isPremium && (
            <>
              <Separator className="my-4" />

              {/* Premium Benefits */}
              <PremiumBenefits />
            </>
          )}
        </div>

        {/* Status messages for subscription actions */}
        <StatusMessages error={error} success={success} />

        {/* {isPremium && (
          <>
            <Separator className='my-4' />

            <Button
              variant='ghost'
              className='text-muted-foreground hover:text-foreground flex items-center px-2'
            >
              View Billing History
              <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </>
        )} */}

        {!isPremium && (
          <>
            <Separator className="my-4" />

            {/* Premium Callout */}
            <div className="py-2">
              <Alert className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20 border border-emerald-100/50 dark:border-emerald-800/20">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <div>
                    <h4 className="font-medium text-base">
                      Upgrade to Premium
                    </h4>
                    <AlertDescription className="mt-1">
                      Get unlimited messages and access to all premium features.
                    </AlertDescription>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <SubscriptionDialog
                    buttonSize="sm"
                    buttonClassName="shadow-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
                    buttonText="View Plans"
                    source="subscription_tab_callout"
                  />
                </div>
              </Alert>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionTab;
