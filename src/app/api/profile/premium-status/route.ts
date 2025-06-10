import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabaseClient";

// POST handler to update premium status
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        {
          error: "Missing wallet address",
        },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.json();

    // Validate isPremium field
    if (typeof body.isPremium !== "boolean") {
      return NextResponse.json(
        {
          error: "isPremium field must be a boolean",
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Update user premium status with a simpler query that doesn't rely on updated_at
    const { error } = await supabase
      .from("user_profiles")
      .update({
        is_premium: body.isPremium,
      })
      .eq("address", address);

    // Separately fetch the updated user profile
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("is_premium")
      .eq("address", address)
      .maybeSingle();

    if (error) {
      console.error("Error updating premium status:", error);
      return NextResponse.json(
        {
          error: "Failed to update premium status",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: !error,
      isPremium: userData?.is_premium || false,
    });
  } catch (error) {
    console.error("Error updating premium status:", error);
    return NextResponse.json(
      {
        error: "Error updating premium status",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        {
          error: "Missing wallet address",
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // First check if the user has an active subscription that hasn't expired
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_address", address)
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(1);

    // If we have an active subscription, check if it's still valid (not expired)
    if (!subscriptionError && subscriptionData && subscriptionData.length > 0) {
      const subscription = subscriptionData[0];
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const now = new Date();

      // If the current period hasn't ended yet, the user is premium
      if (currentPeriodEnd > now) {
        return NextResponse.json({
          isPremium: true,
        });
      } else {
        // Subscription has expired, update its status to inactive
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.stripe_subscription_id);

        if (updateError) {
          console.error("Error updating expired subscription:", updateError);
        }

        // Also update the user's premium status
        const { error: userUpdateError } = await supabase
          .from("user_profiles")
          .update({
            is_premium: false,
          })
          .eq("address", address);

        if (userUpdateError) {
          console.error("Error updating user premium status:", userUpdateError);
        }
      }
    }

    // As a fallback, check the is_premium flag in the user profile
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("is_premium")
      .eq("address", address)
      .single();

    if (userError) {
      console.error("Error fetching user premium status:", userError);
      return NextResponse.json(
        {
          isPremium: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if the user is whitelisted (duplicated from userManager for simplicity)
    const WHITELISTED_ADDRESSES: string[] = [
      "0x5A9e792143bf2708b4765C144451dCa54f559a19",
      "0x1155b614971f16758C92c4890eD338C9e3ede6b7",
      "0x8Ae9C2f2B9530d4209Ca1e848033f1A161bE8e59",
      "0x534947b0Ebb59658Dd8a47624Aeee8DA3A086635",
      "0xec7e64b33EE52Bed121a551901Bd124986BC3b58",
      "0x2273B2Fb1664f100C07CDAa25Afd1CD0DA3C7437",
    ];

    const isWhitelisted = WHITELISTED_ADDRESSES.some(
      whitelistedAddress =>
        whitelistedAddress.toLowerCase() === address.toLowerCase()
    );

    // If the user is whitelisted, they're considered premium
    if (isWhitelisted) {
      return NextResponse.json({
        isPremium: true,
      });
    }

    // Otherwise, return whatever is in the database
    return NextResponse.json({
      isPremium: userData?.is_premium || false,
    });
  } catch (error) {
    console.error("Error checking premium status:", error);
    return NextResponse.json(
      {
        error: "Error checking premium status",
      },
      { status: 500 }
    );
  }
}
