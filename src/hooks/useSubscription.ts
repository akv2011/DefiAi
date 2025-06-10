import { useEffect, useState } from "react";

import { trackConversion } from "@/lib/utils";

import { useUser } from "@/contexts/user-context";

import { PREMIUM_PLANS } from "@/constants/subscriptionPlans";

type AnimationData = any;

interface UseSubscriptionReturn {
  isSuccessDialogOpen: boolean;
  setSuccessDialogOpen: (open: boolean) => void;
  animationData: AnimationData | null;
  handleSuccessDialogClose: () => void;
}

/**
 * Hook to manage subscription-related functionality
 * Handles success dialog state, animation loading, and premium status updates
 */
export function useSubscription(): UseSubscriptionReturn {
  const [isSuccessDialogOpen, setSuccessDialogOpen] = useState(false);
  const [animationData, setAnimationData] = useState<AnimationData | null>(
    null
  );
  const { address, checkPremiumStatus } = useUser();

  // Load animation data
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    // Load the animation file dynamically - using the JSON file instead of .lottie
    fetch("/lottie/success.json")
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error("Error loading animation:", error));
  }, []);

  // Check if we should show the success dialog
  useEffect(() => {
    // Only run when URL has success parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      const sessionId = url.searchParams.get("session_id");
      const planQueryParam = url.searchParams.get("plan");

      if (success === "true") {
        // Show the dialog immediately
        setSuccessDialogOpen(true);

        // Clean up URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Get plan information
        // Default to annual plan if no plan is specified
        const planId = planQueryParam || "annual";
        const planData =
          PREMIUM_PLANS.find(plan => plan.id === planId) || PREMIUM_PLANS[1];
        const planPrice = planData.price.replace("$", "");

        // Track conversion with Trackdesk
        trackConversion(planPrice, {
          externalId: sessionId || undefined,
          customerId: address || undefined,
          currencyCode: "USD",
          status: "CONVERSION_STATUS_APPROVED",
          customParams: {
            advS1: planId,
          },
        });

        // Update premium status via API route
        if (address) {
          console.log(
            `Attempting to update premium status for address: ${address}`
          );

          // Update premium status directly using the same endpoint that checkPremiumStatus uses
          fetch(`/api/profile/premium-status?address=${address}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              isPremium: true,
            }),
          })
            .then(response => {
              console.log(
                `Premium status update response status: ${response.status}`
              );

              if (response.ok) {
                return response.json().then(data => {
                  console.log("Premium status update response:", data);

                  // Refresh the premium status in context
                  checkPremiumStatus();

                  // Log confirmation for debugging
                  console.log("Premium status updated successfully");
                });
              } else {
                // If there was an error, log it
                return response
                  .json()
                  .then(data => {
                    console.error("Failed to update premium status:", data);
                  })
                  .catch(err => {
                    console.error("Error parsing error response:", err);
                  });
              }
            })
            .catch(error => {
              console.error("Network error updating premium status:", error);
            });
        }
      }
    }
  }, [address, checkPremiumStatus]);

  // Close dialog handler
  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
  };

  return {
    isSuccessDialogOpen,
    setSuccessDialogOpen,
    animationData,
    handleSuccessDialogClose,
  };
}
