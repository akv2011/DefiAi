const BASE_URL = "https://api.llama.fi";

export async function getDefiLlamaChains() {
  try {
    const response = await fetch(`${BASE_URL}/v2/chains`); // Use of /v2/chains endpoint
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching DefiLlama chains:", error);
    return {
      error: "Failed to fetch DefiLlama chains.",
    }; // Return error object for handling in chatbot
  }
}
