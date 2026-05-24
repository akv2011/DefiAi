// src/lib/morpheusSearch.ts
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
import {
  CoreMessage,
  // Import CoreMessage for the simplified history type
  experimental_createMCPClient as createMCPClient,
  generateText,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

import { morpheusSystemPrompt } from "@/app/api/chat/morpheusSystemPrompt";
// Adjust path if your types file is located differently
import { UIMessage } from "@/app/api/chat/tools/types";

// Import the NEW filter function from your utility file
import { filterAndSimplifyHistoryForLLM } from "./messageUtils";

async function getMorpheusSearchRawStream(
  // Receive the original, full messages from route.ts
  originalMessages: UIMessage[]
): Promise<ReadableStream> {
  const requestId = `morpheus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(
    `[${requestId}] Morpheus-Search: Setting up streamText. Original message count: ${originalMessages.length}`
  );

  // Guard: MCP is required for morpheus-search mode.
  if (!process.env.MATRIX_MCP_URL) {
    throw new Error(
      "Morpheus Search is unavailable: MATRIX_MCP_URL is not configured in this deployment."
    );
  }

  // Initialize MCP Client early
  const mcpClient = await createMCPClient({
    transport: {
      type: "sse",
      url: process.env.MATRIX_MCP_URL,
      headers: {
        Authorization: `Bearer ${process.env.MATRIX_MCP_API_KEY ?? ""}`,
        "x-api-key": process.env.MATRIX_MCP_API_KEY ?? "",
      },
    },
  });

  try {
    // --- Filter and Simplify History for Morpheus LLM ---
    // This removes role:tool messages and strips tool parts from assistant messages
    console.log(
      `[${requestId}] Morpheus: Original messages before simplifying for model:`,
      JSON.stringify(originalMessages, null, 2)
    );
    const messagesForMorpheusModel: CoreMessage[] =
      await filterAndSimplifyHistoryForLLM(originalMessages);
    console.log(
      `[${requestId}] Morpheus: Messages after simplifying (sent to model):`,
      JSON.stringify(messagesForMorpheusModel, null, 2)
    );
    // --- End Filter ---

    // Define models via OpenRouter
    // Note: useSearchGrounding was a Google-native option; OpenRouter routes to the
    // same model but without provider-level grounding. NeoSearch falls back to
    // standard text generation (web search context is provided via the tool's prompt).
    const model = openrouter("google/gemini-2.5-flash-preview-04-17");

    const searchEnabledModel = openrouter("google/gemini-2.5-flash-preview-04-17");

    // Load specific Morpheus tools via MCP
    const tools = await mcpClient.tools({
      schemas: {
        get_token_info: {
          description:
            "Get token information including price, market cap, volume, metadata, and optionally historical data",
          parameters: z.object({
            query: z
              .string()
              .describe(
                "Token symbol, name, or contract address to search for"
              ),
            type: z
              .enum(["symbol", "name", "address"])
              .optional()
              .describe(
                'Type of search to perform. Options are "symbol", "name", or "address". If not provided, will auto-detect based on query'
              ),
            historical_days: z
              .number()
              .int()
              .positive()
              .optional()
              .describe(
                "Number of past days to fetch historical price data for (e.g., 7, 30)"
              ),
          }),
        },
        // Add other MCP tool schemas specific to Morpheus if needed
      },
    });
    console.log(
      `[${requestId}] Morpheus MCP tools loaded:`,
      Object.keys(tools)
    );

    // Configure and execute the stream with the simplified history
    const streamResult = streamText({
      model: model,
      // Use the SIMPLIFIED messages array
      messages: messagesForMorpheusModel,
      system: morpheusSystemPrompt,
      tools: {
        // MCP Tools loaded above
        ...tools,

        // NeoSearch Tool (defined locally)
        NeoSearch: tool({
          description:
            "Search the web for current information, news, or context about a topic. Use this for general information needs.",
          parameters: z.object({
            searchQuery: z
              .string()
              .describe("The query to search for on the web"),
          }),
          execute: async ({ searchQuery }) => {
            const neoSearchRequestId = `${requestId}-neosearch`;
            console.log(
              `[${neoSearchRequestId}] 🔍 NeoSearch execute FUNCTION IS BEING CALLED! (Using generateText internally)`
            );
            console.log(
              `[${neoSearchRequestId}] NeoSearch - Search query:`,
              searchQuery
            );

            try {
              // Use the separate search-enabled model for this tool
              const searchResponse = await generateText({
                model: searchEnabledModel,
                prompt: searchQuery,
              });

              const text = searchResponse.text;

              console.log(
                `[${neoSearchRequestId}] NeoSearch successful for query:`,
                searchQuery
              );
              return {
                searchResults: text,
                sources: [],
                metadata: {
                  searchQuery,
                  timestamp: new Date().toISOString(),
                },
              };
            } catch (error: unknown) {
              console.error(
                `[${neoSearchRequestId}] Error in web search execution (using generateText):`,
                error
              );
              throw new Error(
                `NeoSearch failed: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          },
        }),
        // Add other locally defined tools specific to Morpheus if needed
      },
      temperature: 0.2,
      maxSteps: 25, // Adjust as needed
      onFinish: async (finishArgs: { finishReason: string; usage: object }) => {
        // Added type annotation
        // Ensure MCP client is closed when the stream finishes
        await mcpClient.close();
        console.log(
          `[${requestId}] Morpheus-Search: stream finished, MCP client closed. Reason: ${finishArgs.finishReason}`
        );
      },
    });

    // Get the underlying ReadableStream
    const rawStream = streamResult.toDataStream();

    if (!rawStream) {
      // This case should ideally not happen if streamText succeeds
      throw new Error(
        "[${requestId}] streamText did not return a ReadableStream body."
      );
    }

    console.log(
      `[${requestId}] Morpheus-Search: Successfully obtained raw stream.`
    );
    return rawStream;
  } catch (error: unknown) {
    // Ensure MCP client is closed in case of an error during setup or execution
    console.error(
      `[${requestId}] Morpheus-Search: Error during raw stream generation:`,
      error
    );
    // Attempt to close MCP client, catching potential errors during close
    await mcpClient
      .close()
      .catch(closeErr =>
        console.error(
          `[${requestId}] Error closing MCP client during error handling:`,
          closeErr
        )
      );
    // Re-throw the original error to be handled by the calling function (route.ts)
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export { getMorpheusSearchRawStream };
