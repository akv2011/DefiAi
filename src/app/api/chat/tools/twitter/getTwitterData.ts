/* eslint-disable */
import { handleToolError } from "../types";

// import { twitterClient } from "./twitter/twitterApi";

export async function getTwitterData({
  action,
  text,
  query,
  maxResults,
}: {
  action: "tweet" | "search";
  text?: string;
  query?: string;
  maxResults?: number;
}) {
  try {
    // if (action === 'tweet' && text) {
    //   const result = await twitterClient.tweet(text);
    //   return {
    //     type: 'tweet',
    //     data: result,
    //   };
    // }

    // if (action === 'search' && query) {
    //   const results = await twitterClient.searchTweets(query, maxResults);
    //   return {
    //     type: 'search',
    // data: results,
    //   };
    // }

    throw new Error("Invalid action or missing required parameters");
  } catch (error) {
    return handleToolError(error, "getTwitterData");
  }
}
