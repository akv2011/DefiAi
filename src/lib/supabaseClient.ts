import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Read-only client for frontend components
export const supabaseReadOnly = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Export createClient function for server-side operations
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_KEY || "";

  if (!supabaseKey) {
    console.error(
      "Missing SUPABASE_KEY. Server-side Supabase operations will fail."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};
