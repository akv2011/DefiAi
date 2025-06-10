import { CoreMessage } from "ai";

import { UIMessage } from "@/app/api/chat/tools/types";

export async function filterAndSimplifyHistoryForLLM(
  messages: UIMessage[]
): Promise<CoreMessage[]> {
  const simplifiedHistory: CoreMessage[] = [];
  console.log(
    `>>> Simplifying history for LLM input. Original count: ${messages.length}`
  );

  for (const message of messages) {
    if (message.role === "system") {
      if (
        typeof message.content === "string" &&
        message.content.trim().length > 0
      ) {
        simplifiedHistory.push({ role: "system", content: message.content });
      }
    } else if (message.role === "user") {
      let userText = "";
      if (typeof message.content === "string") {
        userText = message.content;
      } else if (Array.isArray(message.parts)) {
        userText = message.parts
          .filter(part => part.type === "text")
          .map(part => (part as { type: "text"; text: string }).text)
          .join("\n");
      }
      if (userText.trim().length > 0) {
        simplifiedHistory.push({ role: "user", content: userText.trim() });
      }
    } else if (message.role === "assistant") {
      let assistantText = "";
      if (typeof message.content === "string") {
        assistantText = message.content;
      } else if (Array.isArray(message.parts)) {
        assistantText = message.parts
          .filter(part => part.type === "text")
          .map(part => (part as { type: "text"; text: string }).text)
          .join("");
      }
      if (assistantText.trim().length > 0) {
        simplifiedHistory.push({
          role: "assistant",
          content: assistantText.trim(),
        });
      }
    }
  }

  console.log(
    `<<< Simplified history complete. New count: ${simplifiedHistory.length}`
  );
  return simplifiedHistory;
}
export async function filterToolCallIdsForModel(
  messages: UIMessage[]
): Promise<UIMessage[]> {
  console.warn(
    "filterToolCallIdsForModel is deprecated for LLM history preparation."
  );
  return messages;
}
