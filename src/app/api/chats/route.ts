import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabaseClient";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const chatId = searchParams.get("id");

    if (!walletAddress || !chatId) {
      return NextResponse.json(
        {
          error: "Wallet address and chat ID are required",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: existingChat, error: queryError } = await supabase
      .from("saved_chats")
      .select("id, wallet_address")
      .eq("id", chatId)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking if chat exists:", queryError);
      return NextResponse.json(
        {
          error: "Failed to verify chat ownership",
          details: queryError.message,
        },
        { status: 500 }
      );
    }

    if (!existingChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (existingChat.wallet_address !== walletAddress) {
      return NextResponse.json(
        {
          error: "You don't have permission to delete this chat",
        },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("saved_chats")
      .delete()
      .eq("id", chatId)
      .eq("wallet_address", walletAddress);

    if (error) {
      console.error("Delete chat error:", error);
      return NextResponse.json(
        {
          error: "Failed to delete chat",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
