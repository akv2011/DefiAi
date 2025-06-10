import { NextResponse } from "next/server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { createClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, wallet_address, publish } = body;

    if (!id || !wallet_address) {
      return NextResponse.json(
        {
          error: "Chat ID and wallet address are required",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if the chat exists and belongs to the user
    const { data: existingChat, error: queryError } = await supabase
      .from("saved_chats")
      .select("id, wallet_address, messages, label")
      .eq("id", id)
      .eq("wallet_address", wallet_address)
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
      return NextResponse.json(
        {
          error: "Chat not found or you don't have permission to modify it",
        },
        { status: 404 }
      );
    }

    let generatedShareSummary: string | null = null;
    let publicChatLink: string | null = null;

    if (publish) {
      const chatMessages = existingChat.messages || [];
      const chatLabel = existingChat.label || "this chat";
      let contentToSummarizeForLLM = `Chat Label: ${chatLabel}\n\n`;
      if (Array.isArray(chatMessages) && chatMessages.length > 0) {
        contentToSummarizeForLLM += chatMessages
          .slice(0, 5)
          .map(
            (msg: any) =>
              `${msg.role}: ${
                typeof msg.content === "string"
                  ? msg.content.slice(0, 200)
                  : JSON.stringify(msg.content).slice(0, 200)
              }`
          )
          .join("\n");
      } else {
        contentToSummarizeForLLM += "No messages available for summary.";
      }
      if (
        contentToSummarizeForLLM.length > 10 &&
        (chatMessages.length > 0 || chatLabel !== "this chat")
      ) {
        try {
          const { text: summaryText } = await generateText({
            model: google("gemini-1.5-flash"),
            prompt: `Generate a concise, engaging summary (max 80 words, ideally 1-3 short sentences) for a chat titled \"${chatLabel}\". The chat content starts with: \"${contentToSummarizeForLLM.slice(
              0,
              600
            )}\". Do NOT use markdown, bold, or special formatting. If there are too many chat pormts then only use the core ones to generate context 
            Do NOT generate generic templates or options. Write a natural, intriguing summary suitable for social media, highlighting the main topic and sentiment of the chat.`,
          });
          generatedShareSummary = summaryText.trim();
        } catch (summaryError) {
          console.error("Error generating chat summary:", summaryError);
        }
      }
      publicChatLink = `${
        process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"
      }/chat/${id}`;
    }

    const publishData: any = publish
      ? {
          is_public: true,
          published_at: new Date().toISOString(),
          published_by: wallet_address,
        }
      : {
          is_public: false,
          published_at: null,
          published_by: null,
        };

    const { data, error } = await supabase
      .from("saved_chats")
      .update(publishData)
      .eq("id", id)
      .eq("wallet_address", wallet_address)
      .select("id, is_public, published_at");

    if (error) {
      console.error("Update chat visibility error:", error);
      return NextResponse.json(
        {
          error: "Failed to update chat visibility",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const updatedChatData = data[0];

    return NextResponse.json({
      success: true,
      data: {
        ...updatedChatData,
        share_summary: generatedShareSummary,
        public_chat_link: publicChatLink,
      },
      message: publish
        ? "Chat published successfully. Summary generated."
        : "Chat unpublished successfully.",
    });
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
