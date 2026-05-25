import { NextRequest, NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  // Verify all required keys are present
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_dummy") {
    console.warn("STRIPE_SECRET_KEY is not configured, Stripe is disabled in this deployment.");
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
      .select("user_address, stripe_subscription_id, cancel_at_period_end")
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

    // Check if subscription is set to cancel at period end
    if (!subscriptionData.cancel_at_period_end) {
      return NextResponse.json(
        {
          error: "Subscription is not scheduled for cancellation",
        },
        { status: 400 }
      );
    }

    // Reactivate the subscription by removing the cancel_at_period_end flag
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // Update the subscription in Supabase
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: false,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
      return NextResponse.json(
        {
          error: "Error updating subscription status in database",
        },
        { status: 500 }
      );
    }

    // Also ensure the user's premium status is set to true
    const { error: userUpdateError } = await supabase
      .from("user_profiles")
      .update({
        is_premium: true,
        updated_at: new Date().toISOString(),
      })
      .eq("address", address);

    if (userUpdateError) {
      console.error("Error updating user premium status:", userUpdateError);
      // Continue anyway, this will be fixed by the webhook
    }

    return NextResponse.json({
      success: true,
      message: "Subscription has been reactivated",
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(
        updatedSubscription.items.data[0].current_period_end * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return NextResponse.json(
      {
        error: "Error reactivating subscription",
      },
      { status: 500 }
    );
  }
}
