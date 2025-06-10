import { SupabaseClient } from "@supabase/supabase-js";

import { supabaseReadOnly } from "@/lib/supabaseClient";

// Whitelist of addresses that bypass quota restrictions
const WHITELISTED_ADDRESSES: string[] = [
  "0x5A9e792143bf2708b4765C144451dCa54f559a19",
  "0x1155b614971f16758C92c4890eD338C9e3ede6b7",
  "0x8Ae9C2f2B9530d4209Ca1e848033f1A161bE8e59",
  "0x534947b0Ebb59658Dd8a47624Aeee8DA3A086635",
  "0xec7e64b33EE52Bed121a551901Bd124986BC3b58",
  "0x2273B2Fb1664f100C07CDAa25Afd1CD0DA3C7437",
];

// Helper function to check if an address is whitelisted
function isWhitelisted(address: string): boolean {
  return WHITELISTED_ADDRESSES.some(
    whitelistedAddress =>
      whitelistedAddress.toLowerCase() === address.toLowerCase()
  );
}

export interface UserQuota {
  address: string;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  isPremium: boolean;
  totalMessages?: number;
  email?: string; // Added email field
}

/**
 * Ensures a user exists in the database
 */
export async function ensureUserExists(
  supabase: SupabaseClient,
  address: string
) {
  try {
    // First check if the table exists
    try {
      // Check if user exists - avoid using .single() to prevent 406 errors
      const { data: existingUsers, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("address", address);

      if (fetchError) {
        // If it's not a table missing error, rethrow it
        if (fetchError.code !== "42P01") {
          console.error(`Error fetching user:`, fetchError);
          throw new Error(`Error fetching user: ${fetchError.message}`);
        } else {
          // Table doesn't exist, log it and continue to try creating the table
          console.warn(
            "user_profiles table doesn't exist, attempting to create it"
          );
          // The table will be created through the SQL scripts, but we'll continue to create the user
        }
      } else {
        // If user exists, return the first matching record
        if (existingUsers && existingUsers.length > 0) {
          return existingUsers[0];
        }
      }
    } catch (tableCheckError) {
      console.error("Error checking if user exists:", tableCheckError);
      // Continue to attempt to create the user
    }

    // If user doesn't exist, create one with default limits

    // Set default profile values
    const userProfile = {
      address,
      daily_message_limit: 10, // Default limit
      is_premium: false,
      // Adding a temp email for Stripe checkout based on address
      // This should be updated by the user later
      email: `${address.toLowerCase()}@wallet.temporary`,
    };

    const { data: newUsers, error: insertError } = await supabase
      .from("user_profiles")
      .insert([userProfile])
      .select();

    if (insertError) {
      console.error(`Error creating user:`, insertError);
      throw new Error(`Error creating user: ${insertError.message}`);
    }

    if (!newUsers || newUsers.length === 0) {
      console.error(`No user returned after insert for ${address}`);
      throw new Error(`Failed to create user profile for ${address}`);
    }

    return newUsers[0];
  } catch (err) {
    console.error(`Unexpected error in ensureUserExists:`, err);
    throw err;
  }
}

/**
 * Get user's daily message quota and usage
 */
export async function getUserQuota(
  supabase: SupabaseClient,
  address: string
): Promise<UserQuota> {
  try {
    // Ensure user exists
    const user = await ensureUserExists(supabase, address);

    // Get today's usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usageData, error: usageError } = await supabase
      .from("message_usage")
      .select("message_count")
      .eq("user_address", address)
      .eq("usage_date", today);

    if (usageError) {
      throw new Error(`Error fetching usage: ${usageError.message}`);
    }

    const usedToday = usageData?.[0]?.message_count || 0;
    const isPremium = isWhitelisted(address) || user.is_premium;

    // Unlimited quota for premium or whitelisted users
    const dailyLimit = isPremium ? 999999 : user.daily_message_limit;

    return {
      address: user.address,
      dailyLimit,
      usedToday,
      remaining: dailyLimit - usedToday,
      isPremium,
      email: user.email,
    };
  } catch (err) {
    console.error(`Unexpected error in getUserQuota:`, err);
    throw err;
  }
}

/**
 * Increment message usage for a user
 */
export async function incrementMessageUsage(
  supabase: SupabaseClient,
  address: string
): Promise<boolean> {
  try {
    // Get today's usage
    const today = new Date().toISOString().split("T")[0];

    let usedToday = 0;

    try {
      const { data: usage, error: usageError } = await supabase
        .from("message_usage")
        .select("message_count")
        .eq("user_address", address)
        .eq("usage_date", today);

      // If error is not a table missing error, throw it
      if (usageError && usageError.code !== "42P01") {
        throw new Error(`Error fetching usage: ${usageError.message}`);
      }

      usedToday = usage && usage.length > 0 ? usage[0].message_count : 0;
    } catch (tableCheckError) {
      console.warn(
        "Error checking message usage, table may not exist:",
        tableCheckError
      );
      // Continue with zero usage count
    }

    // Ensure user exists in the database first
    await ensureUserExists(supabase, address);

    try {
      // Get user quota - will already account for premium status
      const quota = await getUserQuota(supabase, address);

      // Only check quotas for non-premium, non-whitelisted users
      if (!quota.isPremium && quota.remaining <= 0) {
        throw new Error("Daily message quota exceeded");
      }
    } catch (quotaError) {
      // If quota checking fails, log the error but continue for now
      // This allows normal operation even if quotas can't be checked
      console.error("Error checking message quota:", quotaError);
    }

    try {
      // Upsert the usage record for ALL users including whitelisted users
      const { error } = await supabase.from("message_usage").upsert(
        {
          user_address: address,
          usage_date: today,
          message_count: usedToday + 1,
        },
        {
          onConflict: "user_address,usage_date",
        }
      );

      if (error) {
        throw new Error(`Error updating message usage: ${error.message}`);
      }
    } catch (upsertError) {
      console.error("Error updating message usage:", upsertError);
      // If this fails, we'll just continue without updating the usage
      // This allows normal operation even if usage tracking fails
    }

    return true;
  } catch (err) {
    console.error(`Unexpected error in incrementMessageUsage:`, err);
    throw err;
  }
}

// Use the pre-configured read-only Supabase client from supabaseClient.ts

/**
 * Get the total number of messages sent by a user
 */
export async function getTotalMessages(
  supabase: SupabaseClient,
  address: string
): Promise<number> {
  // Ensure user exists
  await ensureUserExists(supabase, address);

  // Method 1: Get all usage records from the message_usage table
  const { data: usageData, error: usageError } = await supabase
    .from("message_usage")
    .select("message_count")
    .eq("user_address", address);

  if (usageError) {
    throw new Error(`Error fetching message usage: ${usageError.message}`);
  }

  // Method 2: Count messages in saved chats
  const { data: chatsData, error: chatsError } = await supabase
    .from("saved_chats")
    .select("messages")
    .eq("wallet_address", address);

  if (chatsError) {
    throw new Error(`Error fetching saved chats: ${chatsError.message}`);
  }

  // Sum up all the message counts from daily usage tracking
  const usageCount =
    usageData?.reduce(
      (total, record) => total + (record.message_count || 0),
      0
    ) || 0;

  // Count the messages in saved chats
  let savedMessagesCount = 0;
  if (chatsData && chatsData.length > 0) {
    for (const chat of chatsData) {
      // Each chat has a messages array, so count the length
      if (chat.messages && Array.isArray(chat.messages)) {
        savedMessagesCount += chat.messages.length;
      }
    }
  }

  // Calculate the final count - use the higher of the two counts
  // This ensures we don't undercount if one method doesn't capture all messages
  const totalMessages = Math.max(usageCount, savedMessagesCount);

  return totalMessages;
}

/**
 * Get user's complete profile with quota and usage information
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  address: string
): Promise<UserQuota & { totalMessages: number }> {
  // Get basic quota info
  const quota = await getUserQuota(supabase, address);

  // Get total messages
  const totalMessages = await getTotalMessages(supabase, address);

  // Return combined data
  return {
    ...quota,
    totalMessages,
  };
}

// These functions have been deprecated in favor of using the base functions
// with the supabaseReadOnly client passed directly.
// They are kept for backward compatibility but should be replaced.

// DEPRECATED: Use getUserQuota(supabaseReadOnly, address) instead
export async function getFrontendUserQuota(
  address: string
): Promise<UserQuota> {
  console.warn(
    "getFrontendUserQuota is deprecated, use getUserQuota(supabaseReadOnly, address) instead"
  );
  return getUserQuota(supabaseReadOnly, address);
}
