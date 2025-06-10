"use client";

import React from "react";

import Lottie from "lottie-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useSubscription } from "@/hooks/useSubscription";

export default function SubscriptionSuccessDialog() {
  const {
    isSuccessDialogOpen,
    setSuccessDialogOpen,
    animationData,
    handleSuccessDialogClose,
  } = useSubscription();

  return (
    <Dialog open={isSuccessDialogOpen} onOpenChange={setSuccessDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Subscription Activated!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-48 h-48 mb-4">
            {animationData ? (
              <Lottie animationData={animationData} loop={false} autoplay />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <p className="text-center text-muted-foreground">
            Thank you for subscribing! Your premium features are now active.
            Enjoy unlimited access to all our tools and features.
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSuccessDialogClose}
            className="w-full light:text-black"
          >
            Start Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
