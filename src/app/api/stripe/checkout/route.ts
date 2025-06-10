import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

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
    // Initialize Stripe here - it will only be called at runtime, not during build
    const stripe = getStripe();
    const { planId, address, paymentMethod, email, promoCode } =
      await req.json();

    if (!planId || !address || !email) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Get price ID from plan ID
    const priceId = PLAN_TO_PRICE[planId as keyof typeof PLAN_TO_PRICE];
    if (!priceId) {
      return NextResponse.json(
        {
          error: "Invalid plan selected",
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Use the ensureUserExists function to make sure we have a user profile
    try {
      // Import the function - dynamically import to avoid Next.js issues
      const { ensureUserExists } = await import("@/lib/userManager");

      // Ensure user exists
      const userData = await ensureUserExists(supabase, address);

      if (!userData) {
        console.error("Failed to find or create user with address:", address);
        return NextResponse.json(
          {
            error: "Unable to find or create user profile",
          },
          { status: 500 }
        );
      }

      // Update the user with the email from the request
      console.log(`Updating user profile with email: ${email}`);
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ email })
        .eq("address", address);

      if (updateError) {
        console.error("Failed to update user with email:", updateError);
        return NextResponse.json(
          {
            error: "Failed to update user profile with email",
          },
          { status: 500 }
        );
      }
    } catch (userError) {
      console.error("Error ensuring user exists:", userError);
      return NextResponse.json(
        {
          error: "Failed to create or retrieve user profile",
        },
        { status: 500 }
      );
    }

    // Refetch the user to get the latest data including any updates
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("address, email")
      .eq("address", address)
      .single();

    if (userError || !userData) {
      console.error("User still not found after attempt to create:", userError);
      return NextResponse.json(
        {
          error: "User profile could not be retrieved or created",
        },
        { status: 500 }
      );
    }

    // Check if email exists one last time
    if (!userData.email) {
      console.error(
        "User still has no email after attempt to create:",
        address
      );
      return NextResponse.json(
        {
          error: "Could not set email for user profile",
        },
        { status: 400 }
      );
    }

    // Create checkout session configuration
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
      customer_email: email,
      client_reference_id: address,
      metadata: {
        ...SUBSCRIPTION_METADATA,
        wallet_address: address,
        payment_method: paymentMethod,
        email: email,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          ...SUBSCRIPTION_METADATA,
          wallet_address: address,
          payment_method: paymentMethod,
          email: email,
          plan_id: planId,
        },
      },
    };

    // Add discount code if provided
    if (promoCode) {
      try {
        // First try to retrieve the promotion code by its visible code
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode,
          limit: 1,
          active: true,
        });

        if (promotionCodes.data.length > 0) {
          // If found, use the promotion code's ID
          sessionConfig.discounts = [
            {
              promotion_code: promotionCodes.data[0].id,
            },
          ];
        } else {
          // If not found as a promotion code, try as a coupon ID directly
          sessionConfig.discounts = [
            {
              coupon: promoCode,
            },
          ];
        }
      } catch (error) {
        console.error("Error retrieving promotion code:", error);
        // Fall back to using the code directly as a coupon
        sessionConfig.discounts = [
          {
            coupon: promoCode,
          },
        ];
      }
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Error creating checkout session",
      },
      { status: 500 }
    );
  }
}
