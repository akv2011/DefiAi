import { NextResponse } from "next/server";

//import { anthropic } from "@ai-sdk/anthropic";
//import { deepseek } from "@ai-sdk/deepseek";
//import { google } from "@ai-sdk/google";
//import { xai } from "@ai-sdk/xai";
//import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
import { EVM, createConfig } from "@lifi/sdk";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import {
  CoreMessage,
  experimental_createMCPClient as createMCPClient,
  generateText,
  streamText,
  tool,
} from "ai";
import { createWalletClient, http } from "viem";
import type { Chain as vChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, mode } from "viem/chains";
import { z } from "zod";

import { CHAINS } from "@/lib/chains";
import { filterAndSimplifyHistoryForLLM } from "@/lib/messageUtils";
import { getMorpheusSearchRawStream } from "@/lib/morpheusSearch";
import { incrementMessageUsage } from "@/lib/userManager";

import { systemPrompt } from "./systemPrompt";
import { UIMessage } from "./tools/types";

const supabaseWrite: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;
// Add an explicit save endpoint for chats that can be called directly
export async function PUT(req: Request) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    console.log(`[${requestId}] PUT /api/chat - Chat save request`);

    // Parse the request body
    const body = await req.json();

    // Get needed fields, with fallbacks for multiple naming patterns
    const id = body.id;
    const walletAddress = body.wallet_address || body.address;
    const messages = body.messages;

    console.log(
      `[${requestId}] Save request for chat id: ${id}, wallet: ${walletAddress}, msg count: ${messages?.length}`
    );

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        {
          error: "Missing required field: id",
        },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        {
          error: "Missing required field: wallet_address",
        },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.warn(`[${requestId}] Empty or invalid messages array`);
    }

    // Generate a title
    let title = "New Conversation";
    try {
      title = await generateConversationTitle(messages || []);
    } catch (titleError) {
      console.log(`[${requestId}] Title generation error:`, titleError);
      // Fall back to first message or default
      title =
        messages && messages.length > 0
          ? messages[0]?.content?.slice(0, 80) || "New Conversation"
          : "New Conversation";
    }

    // Extract message content for user and assistant
    const userMessage = messages?.find((m: UIMessage) => m.role === "user");
    const assistantMessage = messages
      ?.filter((m: UIMessage) => m.role === "assistant")
      .pop();

    const saveData = {
      id,
      wallet_address: walletAddress,
      label: title,
      prompt: userMessage?.content || "",
      response:
        typeof assistantMessage?.content === "string"
          ? assistantMessage.content
          : "Processing...",
      messages: messages || [], // Save the full original messages
      is_favorite: body.is_favorite !== undefined ? body.is_favorite : false,
    };

    console.log(`[${requestId}] Save data prepared:`, {
      id: saveData.id,
      wallet_address: saveData.wallet_address,
      title_length: saveData.label.length,
      message_count: saveData.messages.length,
      is_favorite: saveData.is_favorite,
    });

    try {
      console.log(`[${requestId}] Executing upsert to saved_chats table...`);
      const { error } = await supabaseWrite
        .from("saved_chats")
        .upsert([saveData], {
          onConflict: "id",
        });

      if (error) {
        console.error(`[${requestId}] Save error:`, error);
        return NextResponse.json(
          {
            error: `Failed to save chat: ${error.message}`,
            details: error,
            requestId,
          },
          { status: 500 }
        );
      }

      console.log(`[${requestId}] Chat saved successfully`);
      return NextResponse.json({
        success: true,
        message: "Chat saved successfully",
        requestId,
      });
    } catch (error) {
      console.error(`[${requestId}] Database error:`, error);
      return NextResponse.json(
        {
          error: `Database error: ${error instanceof Error ? error.message : String(error)}`,
          requestId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled exception in PUT:`, error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred during save",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 }
    );
  }
}

export const maxDuration = 120;

const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
); // dummy key
const chains = [base, mode]; // Add other chains if needed

const client = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

createConfig({
  integrator: "ionic",
  providers: [
    EVM({
      getWalletClient: async () => client,
      switchChain: async (chainId: number) =>
        // Switch chain by creating a new wallet client
        createWalletClient({
          account,
          chain: chains.find(chain => chain.id == chainId) as vChain,
          transport: http(),
        }),
    }),
  ],
});

const titleCache = new Map<string, string>();

// Title Generation based on the First message
async function generateConversationTitle(
  messages: UIMessage[]
): Promise<string> {
  try {
    const firstUserMessage = messages.find(
      (m: UIMessage) => m.role === "user" && m.content?.trim().length > 0
    );
    if (!firstUserMessage) return "New Conversation"; // Handle case with no user message

    const cacheKey = `${firstUserMessage.content.slice(0, 100)}|${firstUserMessage.id}`;
    if (titleCache.has(cacheKey)) {
      return titleCache.get(cacheKey)!;
    }
    const { text: title } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      system: `Generate a concise 4-8 word title for this user request. Focus on the main action, asset, or topic. Examples: "Check ETH Balance", "Swap USDC to WETH", "Bitcoin Price Analysis", "Ionic Lend Position". Respond ONLY with the title text, no quotes or punctuation.`,
      messages: [
        {
          role: "user",
          content: `Request: ${firstUserMessage.content.slice(0, 300)}`,
        },
      ],
      maxTokens: 20,
    });

    const cleanTitle = title.trim().replace(/["'.]/g, "").slice(0, 80);

    const finalTitle = cleanTitle || firstUserMessage.content.slice(0, 80);

    // Cache and return
    titleCache.set(cacheKey, finalTitle);
    return finalTitle;
  } catch (error) {
    console.error("Title generation failed:", error);
    // Fallback logic
    const firstMessageContent = messages[0]?.content;
    return typeof firstMessageContent === "string"
      ? firstMessageContent.slice(0, 80).trim() +
          (firstMessageContent.length > 80 ? "..." : "")
      : "New Conversation";
  }
}

export async function POST(req: Request) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  let id: string | undefined;

  try {
    const body = await req.json();
    const {
      messages: originalMessages,
      address,
      searchType,
      vaultDetails,
    } = body;
    id = body.id;

    console.log(`[${requestId}] POST /api/chat - Request received`, {
      id,
      address,
      searchType,
      messageCount: originalMessages?.length,
      hasVaultDetails: !!vaultDetails, // Log if vaultDetails payload exists
    });
    if (vaultDetails && originalMessages && originalMessages.length > 0) {
      const lastMessageIndex = originalMessages.length - 1;
      const lastMessage = originalMessages[lastMessageIndex];

      if (lastMessage.role === "user") {
        const vaultDetailsString = JSON.stringify(vaultDetails);
        const separator = "\n\n--- Vault Context ---\n";
        lastMessage.content += `${separator}${vaultDetailsString}`;

        console.log(
          `[${requestId}] Injected vaultDetails into last user message.`
        );
        // console.log(`[${requestId}] Modified last message:`, JSON.stringify(lastMessage, null, 2));
      }
    }

    // Validate ID early
    if (!id) {
      console.error(`[${requestId}] Missing required field: id`);
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Check if we have a user address for normal requests
    if (!address && searchType !== "morpheus-search") {
      console.error(
        `[${requestId}] User address is required for non-Morpheus search`
      );
      return NextResponse.json(
        {
          error: "User address is required for message quota tracking",
        },
        { status: 400 }
      );
    }

    // Handle morpheus-Search requests
    if (searchType === "morpheus-search") {
      if (!originalMessages || originalMessages.length === 0) {
        console.error(
          `[${requestId}] Morpheus Search error: Received empty messages array.`
        );
        return new Response(
          JSON.stringify({
            error: "Cannot start Morpheus Search with empty message history.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      try {
        console.log(
          `[${requestId}] Calling getMorpheusSearchRawStream with ${originalMessages.length} messages...`
        );
        const rawStream = await getMorpheusSearchRawStream(originalMessages);
        if (rawStream) {
          console.log(
            `[${requestId}] Returning RAW stream from morpheusSearch.`
          );
          return new Response(rawStream, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } else {
          console.error(
            `[${requestId}] getMorpheusSearchRawStream returned null/undefined.`
          );
          throw new Error(
            "getMorpheusSearchRawStream did not return a valid ReadableStream."
          );
        }
      } catch (error) {
        console.error(
          `[${requestId}] Error handling raw stream from getMorpheusSearchRawStream:`,
          error
        );
        return new Response(
          JSON.stringify({
            error: `morpheus-search raw stream error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // --- Quota Check ---
    try {
      await incrementMessageUsage(supabaseWrite, address);
      console.log(`[${requestId}] Quota check passed for address: ${address}`);
    } catch (error: any) {
      if (error.message === "Daily message quota exceeded") {
        console.warn(`[${requestId}] Quota exceeded for address: ${address}`);
        return NextResponse.json(
          {
            error:
              "You have reached your daily message limit. Please try again tomorrow or upgrade your plan.",
          },
          { status: 429 } // Too Many Requests
        );
      }
      console.error(
        `[${requestId}] Error checking message quota (continuing anyway):`,
        error
      );
    }

    const saveChatInitial = async () => {
      try {
        const title = await generateConversationTitle(originalMessages || []);
        const userMessage = originalMessages?.find(
          (m: UIMessage) => m.role === "user"
        );
        const saveData = {
          id,
          wallet_address: address,
          label: title,
          prompt: userMessage?.content || "",
          response: "Processing the request...",
          messages: originalMessages || [],
          is_favorite: false,
        };
        console.log(`[${requestId}] Performing initial save/upsert...`);
        const { error } = await supabaseWrite
          .from("saved_chats")
          .upsert([saveData], {
            onConflict: "id",
          });
        if (error) {
          console.error(`[${requestId}] Error during initial save:`, error);
        } else {
          console.log(`[${requestId}] Initial save successful.`);
        }
      } catch (e) {
        console.error(`[${requestId}] Exception during initial save:`, e);
      }
    };
    await saveChatInitial();

    // Add filter new clietnt side tools here
    console.log(
      `[${requestId}] Sentinel: Original messages before potentially simplifying:`,
      JSON.stringify(originalMessages, null, 2)
    );

    const clientToolNames = new Set([
      "getDesiredChain",
      "getAmount",
      "createPerpsOrder",
      "swap_or_bridge",
      "deposit_withdraw_hyperliquid",
    ]);

    const lastMessage = originalMessages?.[originalMessages.length - 1];
    let previousTurnUsedClientTool = false;

    if (lastMessage?.role === "assistant") {
      const partsToCheck = Array.isArray(lastMessage.parts)
        ? lastMessage.parts
        : [];
      const invocationsToCheck = Array.isArray(lastMessage.toolInvocations)
        ? lastMessage.toolInvocations
        : [];

      previousTurnUsedClientTool = partsToCheck.some(
        (part: any) =>
          part.type === "tool-invocation" &&
          part.toolInvocation &&
          clientToolNames.has(part.toolInvocation.toolName)
      );

      // Fallback
      if (!previousTurnUsedClientTool) {
        previousTurnUsedClientTool = invocationsToCheck.some(
          (invocation: any) =>
            invocation && clientToolNames.has(invocation.toolName)
        );
      }
    }

    let messagesToSendToModel: CoreMessage[];

    if (previousTurnUsedClientTool) {
      console.log(
        `[${requestId}] Previous assistant turn included a client tool result. Using original messages.`
      );
      messagesToSendToModel = originalMessages as CoreMessage[];
    } else {
      console.log(
        `[${requestId}] Previous assistant turn did NOT include a client tool result. Simplifying history.`
      );
      messagesToSendToModel =
        await filterAndSimplifyHistoryForLLM(originalMessages);
      console.log(
        `[${requestId}] Sentinel: Messages after simplifying (sent to model):`,
        JSON.stringify(messagesToSendToModel, null, 2)
      );
    }

    let mcpClient: MCPClient | undefined;
    let matrixMcpTools = {};
    if (process.env.MATRIX_MCP_URL) {
      try {
        mcpClient = await createMCPClient({
          transport: {
            type: "sse",
            url: process.env.MATRIX_MCP_URL,
            headers: {
              Authorization: `Bearer ${process.env.MATRIX_MCP_API_KEY ?? ""}`,
              "x-api-key": process.env.MATRIX_MCP_API_KEY ?? "",
            },
          },
        });
        matrixMcpTools = await mcpClient.tools();
        console.log(
          `[${requestId}] Matrix MCP Tools loaded:`,
          Object.keys(matrixMcpTools)
        );
      } catch (mcpError) {
        console.error(
          `[${requestId}] Failed to initialize Matrix MCP Client or load tools:`,
          mcpError
        );
      }
    } else {
      console.log(
        `[${requestId}] MATRIX_MCP_URL not set — skipping MCP tool registration.`
      );
    }

    const streamConfig = {
      //model: deepseek("deepseek-chat"),
      //model: anthropic("claude-3-5-sonnet-latest"),
      model: openrouter("x-ai/grok-3-fast"), // Using flash version via OpenRouter
      //model: openrouter('google/gemini-1.5-pro'),
      //model: openrouter("anthropic/claude-3-haiku"),
      //model: openrouter("google/gemini-1.5-flash"),
      //model: openrouter("openai/gpt-4o"),
      messages: messagesToSendToModel,
      tools: {
        ...matrixMcpTools, // Include MCP tools safely

        // Client Tools
        getDesiredChain: tool({
          description: "Get the desired chain from the user",
          parameters: z.object({}),
        }),
        getAmount: tool({
          description: "Get the amount of tokens for any operation",
          parameters: z.object({
            maxAmount: z
              .string()
              .optional()
              .describe(
                "The maximum amount (user's balance) that can be entered"
              ),
            tokenSymbol: z
              .string()
              .optional()
              .describe("The token symbol to display"),
          }),
        }),
        createPerpsOrder: tool({
          description:
            "Create a perps order using the Hyperliquid protocol. All params are optional",
          parameters: z.object({
            market: z
              .string()
              .min(1)
              .optional()
              .describe("The market name (e.g., 'BTC')"),
            size: z.string().min(1).optional().describe("The order size"),
            isBuy: z.boolean().optional().describe("Whether to buy or sell"),
            orderType: z
              .enum(["limit", "market"])
              .optional()
              .describe("The type of order"),
            price: z
              .string()
              .optional()
              .nullable()
              .describe("The order price (required for limit orders)"),
            timeInForce: z
              .enum(["Alo", "Ioc", "Gtc"])
              .optional()
              .describe("Time in force for limit orders"),
          }),
        }),
        swap_or_bridge: tool({
          description:
            "Populates swap and/or bridge transaction data for the LiFi widget",
          parameters: z.object({
            fromToken: z
              .optional(z.string().describe("The token address to swap from"))
              .describe("The token address to swap from"),
            toToken: z
              .optional(z.string().describe("The token address to swap to"))
              .describe("The token address to swap to"),
            fromChain: z
              .optional(
                z.enum(CHAINS).describe("The source chain being bridged from")
              )
              .describe("The source chain being bridged from"),
            toChain: z
              .optional(
                z
                  .enum(CHAINS)
                  .describe("The destination chain being bridged to")
              )
              .describe("The destination chain being bridged to"),
            amount: z
              .string()
              .optional()
              .describe(
                "The amount of tokens to swap, scaled down by the token's decimals. Represent as a Number, i.e. '0.248'"
              ),
          }),
        }),
        deposit_withdraw_hyperliquid: tool({
          description: "Deposit or withdraw from Hyperliquid",
          parameters: z.object({
            action: z.enum(["deposit", "withdraw"]),
            otherChain: z
              .optional(
                z.enum(CHAINS).describe("The source chain being bridged from")
              )
              .describe("The source chain being bridged from"),
          }),
        }),
      },
      async onFinish(finish: {
        response: { messages: any[] };
        toolCalls?: any[];
        toolResults?: any[];
        text?: string;
        usage: any;
        finishReason: string;
      }) {
        console.log(
          `[${requestId}] Stream finished. Reason: ${finish.finishReason}, Usage:`,
          finish.usage
        );

        if (mcpClient) {
          await mcpClient.close();
          console.log(`[${requestId}] MCP Client closed.`);
        }

        const { response } = finish;
        try {
          if (!id || !address) {
            console.error(
              `[${requestId}] Missing id or address in onFinish. Aborting final save.`
            );
            return;
          }
          let title;
          try {
            title = await generateConversationTitle(originalMessages || []);
          } catch (e) {
            console.error(
              `[${requestId}] Title generation error in onFinish:`,
              e
            );
            title =
              originalMessages?.[0]?.content?.slice(0, 80) ||
              "New Conversation";
          }
          const finalAssistantMessage = formatResponseToObject(response);
          const finalMessagesToSave = [
            ...(originalMessages || []),
            finalAssistantMessage,
          ];

          const finalSaveData = {
            id,
            wallet_address: address,
            label: title,
            prompt:
              originalMessages?.find((m: UIMessage) => m.role === "user")
                ?.content || "",
            response: finalAssistantMessage.content || "",
            messages: finalMessagesToSave,
            is_favorite: false,
          };

          console.log(
            `[${requestId}] Preparing final save data. Message count: ${finalMessagesToSave.length}`
          );
          const { error: finalSaveError } = await supabaseWrite
            .from("saved_chats")
            .upsert([finalSaveData], {
              onConflict: "id",
            });

          if (finalSaveError) {
            console.error(
              `[${requestId}] Error during final save in onFinish:`,
              finalSaveError
            );
          } else {
            console.log(`[${requestId}] Final save successful in onFinish.`);
          }
        } catch (error) {
          console.error(
            `[${requestId}] Error processing in onFinish function:`,
            error
          );
        }
      },
      system: systemPrompt(address),
      maxSteps: 25,
      // temperature: 0.7,
    };
    console.log(
      `[${requestId}] Starting streamText with Sentinel model: ${streamConfig.model.modelId}`
    );
    const resultStream = await streamText(streamConfig);
    return resultStream.toDataStreamResponse();
  } catch (error) {
    console.error(
      `[${requestId || "req-unknown"}] ★★★ CRITICAL API ERROR in POST /api/chat ★★★`,
      error
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred in the chat API.";
    if (error instanceof Error && error.stack) {
      console.error(
        `[${requestId || "req-unknown"}] Error Stack Trace:`,
        error.stack
      );
    }
    console.log(`[${requestId || "req-unknown"}] Returning ERROR RESPONSE:`, {
      error: errorMessage,
    });
    return new Response(
      JSON.stringify({
        error: errorMessage,
        requestId: requestId || "req-unknown",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
function formatResponseToObject(response: { messages: any[] }): UIMessage {
  const assistantMsg = response.messages[response.messages.length - 1];
  if (!assistantMsg || assistantMsg.role !== "assistant") {
    console.warn(
      "formatResponseToObject: Could not find valid assistant message in response. Returning placeholder."
    );
    const errorText = "Error: Could not format response.";
    return {
      id: `msg-error-${Date.now()}`,
      role: "assistant",
      content: errorText,
      parts: [{ type: "text", text: errorText }],
    };
  }

  let textContent = "";
  const parts: any[] = [];
  const toolInvocations: any[] = [];

  if (Array.isArray(assistantMsg.content)) {
    assistantMsg.content.forEach((item: any) => {
      if (item.type === "text") {
        textContent += item.text;
        parts.push({ type: "text", text: item.text });
      } else if (item.type === "tool-call") {
      } else if (item.type === "tool-result") {
        parts.push({
          type: "tool-invocation",
          toolInvocation: {
            state: "result",
            toolCallId: item.toolCallId,
            toolName: item.toolName,
            args: item.args || {},
            result: item.result,
          },
        });
        toolInvocations.push({
          state: "result",
          // step: ???
          toolCallId: item.toolCallId,
          toolName: item.toolName,
          args: item.args || {},
          result: item.result,
        });
      }
    });
  } else if (typeof assistantMsg.content === "string") {
    // Handle plain string content
    textContent = assistantMsg.content;
    parts.push({ type: "text", text: textContent });
  }

  return {
    id:
      assistantMsg.id ||
      `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: assistantMsg.createdAt || new Date().toISOString(),
    role: "assistant",
    content: textContent,
    parts,
    toolInvocations,
    revisionId: Math.random().toString(36).substr(2, 16),
  };
}
