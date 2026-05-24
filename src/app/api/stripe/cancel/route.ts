import { NextRequest, NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  // Verify all required keys are present
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_dummy") {
    console.warn("STRIPE_SECRET_KEY is not configured — Stripe is disabled in this deployment.");
    return NextResponse.json(
      {
        error: "Stripe is not configured in this deployment.",
      },
      { status: 503 }
    );
  }

  if (!process.env.SUPABASE_KEY) {
    console.error("SUPABASE_KEY is missing");
    return NextResponse.json(
      {
        error: "Server configuration error",
      },
      { status: 500 }
    );
  }

  try {
    const stripe = getStripe();
    const { subscriptionId, address } = await req.json();

    if (!subscriptionId || !address) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Verify the subscription belongs to the requesting user
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("user_address, stripe_subscription_id")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_address", address)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error(
        "Subscription not found or does not belong to user:",
        subscriptionError
      );
      return NextResponse.json(
        {
          error: "Subscription not found or does not belong to user",
        },
        { status: 404 }
      );
    }

    // Cancel the subscription at period end (doesn't end immediately)
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update the subscription in Supabase
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: true,
        // Removed updated_at to avoid schema cache issue
      })
      .eq("stripe_subscription_id", subscriptionId);

    // Also update the user's premium status when they cancel - they'll still have access
    // until the end of their billing period, but this marks them for updating in the UI
    const { error: userUpdateError } = await supabase
      .from("user_profiles")
      .update({
        is_premium: false,
      })
      .eq("address", address);

    if (userUpdateError) {
      console.error("Error updating user premium status:", userUpdateError);
    } else {
      console.log(
        `Premium status updated to FALSE for user ${address} (will remain active until period end)`
      );
    }

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
      return NextResponse.json(
        {
          error: "Error updating subscription status in database",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(
        updatedSubscription.items.data[0].current_period_end * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      {
        error: "Error canceling subscription",
      },
      { status: 500 }
    );
  }
}
