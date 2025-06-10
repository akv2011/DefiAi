import { NextRequest, NextResponse } from "next/server";

import { PLAN_TO_PRICE, SUBSCRIPTION_METADATA, getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  // Verify all required keys are present
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is missing");
    return NextResponse.json(
      {
        error: "Server configuration error",
      },
      { status: 500 }
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
    const { subscriptionId, newPlanId, address } = await req.json();

    if (!subscriptionId || !newPlanId || !address) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Get price ID from plan ID
    const newPriceId = PLAN_TO_PRICE[newPlanId as keyof typeof PLAN_TO_PRICE];
    if (!newPriceId) {
      return NextResponse.json(
        {
          error: "Invalid plan selected",
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

    // Retrieve the subscription to get the current items
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the current subscription item ID (we need this to update the subscription)
    const subscriptionItemId = subscription.items.data[0].id;

    // Update the subscription plan
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId,
          },
        ],
        // Ensure metadata is preserved
        metadata: {
          ...subscription.metadata,
          ...SUBSCRIPTION_METADATA,
          plan_id: newPlanId,
        },
        // Set proration behavior - this determines how billing changes are handled
        // 'create_prorations' will generate invoice items for the price change
        proration_behavior: "create_prorations",
      }
    );

    // Update the subscription in Supabase
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        plan_id: newPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
      return NextResponse.json(
        {
          error: "Error updating subscription plan in database",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription plan has been updated",
      newPlanId: newPlanId,
      currentPeriodEnd: new Date(
        updatedSubscription.items.data[0].current_period_end * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return NextResponse.json(
      {
        error: "Error updating subscription plan",
      },
      { status: 500 }
    );
  }
}
