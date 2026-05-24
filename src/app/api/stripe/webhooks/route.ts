import { NextRequest, NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabaseClient";

// Helper function to convert ReadableStream to Buffer
async function buffer(readable: ReadableStream) {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

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

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("STRIPE_WEBHOOK_SECRET is not configured — Stripe webhooks are disabled in this deployment.");
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
    // Initialize Stripe here - it will only be called at runtime, not during build
    const stripe = getStripe();

    const body = await buffer(req.body as ReadableStream);
    const signature = req.headers.get("stripe-signature") || "";

    if (!signature) {
      return NextResponse.json(
        {
          error: "Missing Stripe signature",
        },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    // Create Supabase client
    const supabase = createClient();

    // Handle the webhook event
    switch (event.type) {
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          try {
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            const walletAddress = subscription.metadata?.wallet_address;

            if (walletAddress) {
              if (
                invoice.next_payment_attempt === null ||
                subscription.status === "past_due"
              ) {
                const { error: userUpdateError } = await supabase
                  .from("user_profiles")
                  .update({
                    is_premium: false,
                  })
                  .eq("address", walletAddress);

                if (userUpdateError) {
                  console.error(
                    "Error updating user premium status after payment failure:",
                    userUpdateError
                  );
                } else {
                  console.log(
                    `Premium status updated to FALSE for user ${walletAddress} due to payment failure`
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              "Error processing invoice.payment_failed event:",
              error
            );
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "checkout.session.completed": {
        const session = event.data.object as any;

        if (
          session.mode === "subscription" &&
          session.payment_status === "paid"
        ) {
          // Extract necessary information
          const subscriptionId = session.subscription;
          const walletAddress = session.metadata?.wallet_address;
          const userId = session.client_reference_id;

          if (!walletAddress || !userId) {
            console.error(
              "Missing wallet address or user ID in session metadata"
            );
            return NextResponse.json(
              {
                error: "Missing metadata in session",
              },
              { status: 400 }
            );
          }

          // Get subscription details
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          // Get plan details
          const stripePriceId = subscription.items.data[0].plan.id;

          // Determine plan name based on the price ID or metadata
          let planType = "monthly"; // Default to monthly
          let planName = "Premium Monthly";

          // Check if this is an annual plan based on price ID or product ID
          if (
            stripePriceId === process.env.STRIPE_ANNUAL_PRICE_ID ||
            subscription.items.data[0].plan.product ===
              process.env.STRIPE_ANNUAL_PRODUCT_ID
          ) {
            planType = "annual";
            planName = "Premium Annual";
          } else if (session.metadata?.plan_id) {
            // If plan ID is in metadata, use that
            planType = session.metadata.plan_id;
            planName =
              planType === "annual" ? "Premium Annual" : "Premium Monthly";
          }

          console.log(
            `Processing subscription with plan type: ${planType}, plan name: ${planName}`
          );

          // Update user's subscription status in Supabase
          const { error: updateError } = await supabase
            .from("user_subscriptions")
            .upsert({
              user_address: walletAddress,
              status: subscription.status,
              stripe_subscription_id: subscriptionId,
              current_period_end: new Date(
                subscription.items.data[0].current_period_end * 1000
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              payment_method: session.metadata?.payment_method || "card",
              plan_id: planType, // Store "monthly" or "annual" instead of Stripe's price ID
              plan_name: planName, // Store human-readable plan name
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (updateError) {
            console.error(
              "Error updating subscription in Supabase:",
              updateError
            );
            return NextResponse.json(
              {
                error: "Error updating subscription",
              },
              { status: 500 }
            );
          }

          // Also update the user's isPremium status
          const { error: userUpdateError } = await supabase
            .from("user_profiles")
            .update({
              is_premium: true,
              // Removed updated_at to avoid schema cache issue
            })
            .eq("address", walletAddress);

          if (userUpdateError) {
            console.error(
              "Error updating user premium status:",
              userUpdateError
            );
          } else {
            console.log(
              `Premium status updated to TRUE for user ${walletAddress}`
            );
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const walletAddress = subscription.metadata?.wallet_address;
        const userId = subscription.metadata?.user_id;

        if (!walletAddress || !userId) {
          console.error(
            "Missing wallet address or user ID in subscription metadata"
          );
          return NextResponse.json(
            {
              error: "Missing metadata in subscription",
            },
            { status: 400 }
          );
        }

        // Update subscription status in Supabase
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Error updating subscription status:", updateError);
          return NextResponse.json(
            {
              error: "Error updating subscription status",
            },
            { status: 500 }
          );
        }

        // Update user's premium status based on subscription status and expiration date
        const isPremium =
          (subscription.status === "active" ||
            subscription.status === "trialing") &&
          new Date(subscription.current_period_end * 1000) > new Date();

        const { error: userUpdateError } = await supabase
          .from("user_profiles")
          .update({
            is_premium: isPremium,
            // Removed updated_at to avoid schema cache issue
          })
          .eq("address", walletAddress);

        if (userUpdateError) {
          console.error("Error updating user premium status:", userUpdateError);
        } else {
          console.log(
            `Premium status updated to ${isPremium} for user ${walletAddress}`
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const walletAddress = subscription.metadata?.wallet_address;
        const userId = subscription.metadata?.user_id;

        if (!walletAddress || !userId) {
          console.error(
            "Missing wallet address or user ID in subscription metadata"
          );
          return NextResponse.json(
            {
              error: "Missing metadata in subscription",
            },
            { status: 400 }
          );
        }

        const statusToSet =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : "expired";

        // Update subscription status in Supabase
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: statusToSet,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error(
            `Error updating subscription status to ${statusToSet}:`,
            updateError
          );
          return NextResponse.json(
            {
              error: "Error updating subscription status",
            },
            { status: 500 }
          );
        }

        // Update user's premium status
        const { error: userUpdateError } = await supabase
          .from("user_profiles")
          .update({
            is_premium: false,
            // Removed updated_at to avoid schema cache issue
          })
          .eq("address", walletAddress);

        if (userUpdateError) {
          console.error("Error updating user premium status:", userUpdateError);
        } else {
          console.log(
            `Premium status updated to FALSE for user ${walletAddress} due to ${event.type}`
          );
        }
        break;
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
      },
      { status: 500 }
    );
  }
}

// Required to handle raw body data
export const config = {
  api: {
    bodyParser: false,
  },
};
