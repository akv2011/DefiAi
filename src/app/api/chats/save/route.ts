import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      wallet_address,
      messages = [],
      label = "New Chat",
      prompt = "",
      response = "",
      is_public = false,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: "Chat ID is required",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const now = new Date().toISOString();

    const { data: existingChat, error: queryError } = await supabase
      .from("saved_chats")
      .select("id, wallet_address, is_public")
      .eq("id", id)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking if chat exists:", queryError);
    }

    if (existingChat) {
      if (existingChat.wallet_address !== wallet_address) {
        return NextResponse.json(
          {
            error: "You don't have permission to modify this chat",
          },
          { status: 403 }
        );
      }

      const { data, error } = await supabase
        .from("saved_chats")
        .update({
          messages,
          updated_at: now,
          label,
          prompt,
          response,
          is_public,
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Update chat error:", error);
        return NextResponse.json(
          {
            error: "Failed to update chat",
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } else {
      const { data, error } = await supabase
        .from("saved_chats")
        .insert({
          id,
          wallet_address,
          messages,
          label,
          prompt,
          response,
          is_favorite: false,
          is_public: is_public,
          published_at: is_public ? now : null,
          published_by: is_public ? wallet_address : null,
        })
        .select();

      if (error) {
        console.error("Create chat error:", error);
        return NextResponse.json(
          {
            error: "Failed to create chat",
            details: error.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
