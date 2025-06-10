import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    const supabase = createClient();

    const { data, error, count } = await supabase
      .from("saved_chats")
      .select("id, label, wallet_address, created_at, published_at", {
        count: "exact",
      })
      .eq("is_public", true)
      .order("published_at", {
        ascending: false,
      })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error("Error fetching public chats:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch public chats",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count,
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
