import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabaseClient";

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

    // Fetch user profile to check premium status
    const { data, error } = await supabase
      .from("user_profiles")
      .select("is_premium")
      .eq("address", address)
      .single();

    if (error) {
      console.error("Error fetching user premium status:", error);
      return NextResponse.json(
        {
          isPremium: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isPremium: data?.is_premium || false,
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
