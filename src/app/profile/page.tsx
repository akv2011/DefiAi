"use client";

import React, { useEffect, useState } from "react";

import { CreditCard, RefreshCcw, Settings, Shield, User } from "lucide-react";

// Importing our new components
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import TabContents from "@/components/profile/TabContents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { supabaseReadOnly } from "@/lib/supabaseClient";

import { useUser } from "@/contexts/user-context";

export default function ProfilePage() {
  const { address, isConnected, isPremium, userProfile, isProfileLoading } =
    useUser();
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");

  // Subscription data type - must match the one in TabContents.tsx
  interface SubscriptionState {
    active: boolean;
    plan: string;
    status: "active" | "canceled" | "past_due" | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_subscription_id?: string | null;
  }

  const [subscription, setSubscription] = useState<SubscriptionState>({
    active: false,
    plan: "",
    status: null,
    current_period_end: null,
    cancel_at_period_end: false,
    stripe_subscription_id: null,
  });

  // State for payment messages
  const [paymentStatus, setPaymentStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  useEffect(() => {
    // Check for URL parameters regarding payment status
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      const canceled = url.searchParams.get("canceled");
      const crypto = url.searchParams.get("crypto");

      if (success === "true") {
        setPaymentStatus({
          success: true,
          message:
            "Your payment was successful! Your premium subscription has been activated.",
        });

        // Clean up the URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (canceled === "true") {
        setPaymentStatus({
          success: false,
          message:
            "Your payment was canceled. You can try again whenever you're ready.",
        });

        // Clean up the URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (crypto === "success") {
        setPaymentStatus({
          success: true,
          message:
            "Your crypto payment has been received! Your subscription will be activated once the transaction is confirmed.",
        });

        // Clean up the URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (crypto === "canceled") {
        setPaymentStatus({
          success: false,
          message:
            "Your crypto payment process was canceled. You can try again whenever you're ready.",
        });

        // Clean up the URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  useEffect(() => {
    async function loadSubscriptionData() {
      if (isConnected && address) {
        try {
          setSubscriptionLoading(true);

          // Fetch subscription data from Supabase using read-only client
          try {
            const { data: subscriptionData, error: subscriptionError } =
              await supabaseReadOnly
                .from("user_subscriptions")
                .select("*")
                .eq("user_address", address)
                .order("created_at", {
                  ascending: false,
                })
                .limit(1);

            // Add debug logging
            console.log(
              "Subscription data fetched:",
              JSON.stringify(subscriptionData)
            );

            // We changed from .single() to .limit(1) to avoid 406 errors
            // Now we need to check if we got any data back
            if (
              !subscriptionError &&
              subscriptionData &&
              subscriptionData.length > 0
            ) {
              const subscription = subscriptionData[0];
              console.log(
                "Found subscription record with plan_id:",
                subscription.plan_id
              );

              // Use plan_name if available, otherwise derive from plan_id
              let planName =
                subscription.plan_name ||
                (subscription.plan_id === "annual"
                  ? "Premium Annual"
                  : "Premium Monthly");

              // If plan_id is a Stripe price ID (starts with "price_") and plan_name is not set, default to Monthly
              if (
                subscription.plan_id.startsWith("price_") &&
                !subscription.plan_name
              ) {
                planName = "Premium Monthly"; // Default for existing subscriptions
              }

              console.log("Using plan name:", planName);

              setSubscription({
                active: subscription.status === "active",
                plan: planName,
                status: subscription.status,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                stripe_subscription_id: subscription.stripe_subscription_id,
              });
            } else if (isPremium) {
              console.log(
                "No subscription record found, using fallback for premium user"
              );
              // Fallback if no subscription record but user is marked as premium
              setSubscription({
                active: true,
                plan: "Premium Monthly", // Changed to Monthly as the default plan
                status: "active",
                current_period_end: new Date(
                  Date.now() + 1000 * 60 * 60 * 24 * 30
                ).toISOString(),
                cancel_at_period_end: false,
                stripe_subscription_id: null,
              });
            }
          } catch (subError) {
            console.error("Error fetching subscription data:", subError);

            // Table probably doesn't exist yet, fall back to user profile premium status
            if (isPremium) {
              console.log(
                "Error with subscription query, using fallback for premium user"
              );
              setSubscription({
                active: true,
                plan: "Premium Monthly", // Use consistent naming with Monthly plan
                status: "active",
                current_period_end: new Date(
                  Date.now() + 1000 * 60 * 60 * 24 * 30
                ).toISOString(),
                cancel_at_period_end: false,
                stripe_subscription_id: null,
              });
            }
          }
        } catch (error) {
          console.error("Error loading user data", error);
        } finally {
          setSubscriptionLoading(false);
        }
      }
    }

    loadSubscriptionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to view your profile and manage your
              subscription.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button size="lg" className="w-full">
              Connect Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (subscriptionLoading || isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <RefreshCcw className="h-10 w-10 animate-spin text-primary/70" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 sm:py-10 px-4 sm:px-6 overflow-y-auto min-h-screen">
      {paymentStatus.message && (
        <div
          className={`mb-6 p-4 border rounded-md ${
            paymentStatus.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
              : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
          }`}
        >
          {paymentStatus.message}
        </div>
      )}

      <Tabs value={activeTab} className="w-full">
        <div className="mb-6 sticky top-0 z-10 bg-background pb-2 pt-1 md:hidden">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger
              value="general"
              onClick={() => setActiveTab("general")}
              className={`flex gap-2 items-center ${
                activeTab === "general" ? "data-[state=active]" : ""
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              onClick={() => setActiveTab("subscription")}
              className={`flex gap-2 items-center ${
                activeTab === "subscription" ? "data-[state=active]" : ""
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Subscription</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              onClick={() => setActiveTab("account")}
              className={`flex gap-2 items-center ${
                activeTab === "account" ? "data-[state=active]" : ""
              }`}
            >
              <User className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar component */}
          <ProfileSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            address={address}
            userQuota={userProfile}
          />

          {/* Main content area */}
          <div className="md:col-span-3 overflow-y-auto max-h-[80vh] md:max-h-none">
            <TabsContent value="general" className="mt-0">
              {activeTab === "general" && (
                <TabContents
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  userQuota={userProfile}
                  subscription={subscription}
                  address={address}
                />
              )}
            </TabsContent>
            <TabsContent value="subscription" className="mt-0">
              {activeTab === "subscription" && (
                <TabContents
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  userQuota={userProfile}
                  subscription={subscription}
                  address={address}
                />
              )}
            </TabsContent>
            <TabsContent value="account" className="mt-0">
              {activeTab === "account" && (
                <TabContents
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  userQuota={userProfile}
                  subscription={subscription}
                  address={address}
                />
              )}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
