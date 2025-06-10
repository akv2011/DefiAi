export interface SavedMessage {
  id: string;
  wallet_address: string;
  label: string;
  prompt: string;
  response: string;
  created_at: string;
  mode?: "morpheus" | "sentinel";
  is_public?: boolean;
  published_at?: string | null;
  published_by?: string | null;
}
