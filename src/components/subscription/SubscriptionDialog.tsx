"use client";

import React, { useEffect, useState } from "react";

import {
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn, trackClick } from "@/lib/utils";

import { useUser } from "@/contexts/user-context";

import { PREMIUM_PLANS } from "@/constants/subscriptionPlans";

interface SubscriptionDialogProps {
  buttonText?: string;
  buttonClassName?: string;
  buttonSize?: "default" | "sm" | "lg";
  buttonVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  showIcon?: boolean;
  hideIfPremium?: boolean;
  /** Source location that this dialog is being used from (e.g., 'header', 'sidebar', 'profile') */
  source?: string;
}

export const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({
  buttonText = "Upgrade to Premium",
  buttonClassName = "",
  buttonSize = "default",
  buttonVariant = "default",
  showIcon = true,
  hideIfPremium = false,
  source = "unknown",
}) => {
  const { address, isConnected, isPremium, userProfile } = useUser();

  const [selectedPlan, setSelectedPlan] = useState(PREMIUM_PLANS[1].id);
  // Only card payment method is supported by Stripe
  const [paymentMethod] = useState<"card">("card");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize email from userProfile if available
  const [email, setEmail] = useState<string>("");
  // Promo code field
  const [promoCode, setPromoCode] = useState<string>("");

  // Set email from userProfile when available
  useEffect(() => {
    if (
      userProfile?.email &&
      userProfile.email.includes("@") &&
      !userProfile.email.includes("wallet.temporary")
    ) {
      setEmail(userProfile.email);
    }
  }, [userProfile]);

  // Clear error when wallet connection changes
  useEffect(() => {
    if (
      isConnected &&
      error === "No wallet connected. Please connect your wallet first."
    ) {
      setError(null);
    }
  }, [isConnected, error]);

  const handleSubmit = async () => {
    try {
      // Track click on the "Continue to Payment" button
      trackClick("continue_to_payment_click", {
        planId: selectedPlan,
        hasPromoCode: promoCode.trim().length > 0,
        source,
      });

      setIsLoading(true);
      setError(null);

      // Debug connection info
      console.log("Connection info:", {
        address,
        isConnected,
      });

      // Check if user is connected with a wallet
      if (!address || !isConnected) {
        console.error("No wallet address found or not connected:", {
          address,
          isConnected,
        });
        setError("No wallet connected. Please connect your wallet first.");
        setIsLoading(false);
        return;
      }

      // Validate email
      if (!email || !email.includes("@") || !email.includes(".")) {
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }

      console.log(
        "Redirecting to Stripe checkout for plan:",
        selectedPlan,
        "with payment method:",
        paymentMethod,
        "and email:",
        email
      );

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan,
          address,
          paymentMethod,
          email,
          promoCode: promoCode.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const session = await response.json();
      window.location.href = session.url;
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setError(
        err.message || "An error occurred while initiating the payment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If hideIfPremium is true and user is premium, don't render the button
  if (hideIfPremium && isPremium) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={cn(
            "bg-gradient-to-br from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-md cursor-pointer text-white dark:text-black",
            buttonClassName
          )}
          onClick={() => trackClick("upgrade_button_click", { source })}
        >
          {showIcon && <Zap className="mr-2 h-4 w-4" />}
          <span>{buttonText}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-amber-500" />
            Upgrade to DeFi AI Premium
          </DialogTitle>
          <DialogDescription>
            Unlock unlimited requests, premium data sources, and exclusive
            features.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-6">
          {/* Plan selection */}
          <div className="grid grid-cols-2 gap-5 mb-4">
            {PREMIUM_PLANS.map(plan => (
              <Card
                key={plan.id}
                className={cn(
                  "relative p-5 cursor-pointer transition-all hover:shadow-md",
                  selectedPlan === plan.id
                    ? "border border-emerald-500 ring-2 ring-emerald-500 shadow-md ring-opacity-50 outline outline-1 outline-emerald-500"
                    : "border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50",
                  plan.popular
                    ? "bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/10"
                    : "",
                  // Add a subtle background color for the selected plan as fallback for gradients
                  selectedPlan === plan.id
                    ? "bg-emerald-50/30 dark:bg-emerald-900/10"
                    : ""
                )}
                onClick={() => {
                  trackClick("plan_selection_click", {
                    planId: plan.id,
                    planName: plan.name,
                    planPrice: plan.price,
                    isPopular: !!plan.popular,
                    source,
                  });
                  setSelectedPlan(plan.id);
                }}
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Best Value
                  </div>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-3 mb-5">
                  <div className="text-2xl font-bold">{plan.price}</div>
                  {plan.discount && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      {plan.discount}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    per {plan.interval}
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* Billing Information - balanced between compact and spacious */}
          <div className="border rounded-md p-5">
            <h3 className="text-sm font-medium mb-4">Billing Information</h3>
            <div className="space-y-4">
              {/* Email input */}
              <div className="flex flex-col mb-2">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    For receipts & confirmations
                  </span>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-2 border rounded-md bg-background dark:border-gray-700 text-sm"
                  required
                />
              </div>

              {/* Promo code input */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="promo-code" className="text-sm font-medium">
                    Promo Code
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Enter code for discount
                  </span>
                </div>
                <input
                  type="text"
                  id="promo-code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="w-full p-2 border rounded-md bg-background dark:border-gray-700 text-sm"
                />
              </div>

              {/* Payment method */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <span className="text-xs text-muted-foreground">
                    {PREMIUM_PLANS.find(p => p.id === selectedPlan)?.price}{" "}
                    {selectedPlan === "monthly" ? "monthly" : "yearly"}
                  </span>
                </div>

                <div className="flex gap-3">
                  {/* Active payment method */}
                  <div className="flex-1 flex items-center justify-between border rounded-md p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-300">
                        Credit Card
                      </span>
                    </div>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  {/* Disabled payment method */}
                  <div className="flex-1 flex items-center justify-between relative rounded-md border p-2.5 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-70">
                    <div
                      className={cn(
                        "absolute top-0 right-0 px-2 py-0.5",
                        "bg-gradient-to-r from-amber-500 to-orange-600",
                        "text-white text-[10px] font-semibold uppercase",
                        "rounded-bl-md rounded-tr-md shadow-sm"
                      )}
                    >
                      Coming Soon
                    </div>
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Crypto
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              trackClick("cancel_button_click", {
                planId: selectedPlan,
                source,
              });
              setIsOpen(false);
            }}
            className="cursor-pointer mr-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-sm cursor-pointer"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Continue to Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
