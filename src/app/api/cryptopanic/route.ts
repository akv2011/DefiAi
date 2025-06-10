import { NextResponse } from "next/server";

import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get(
      "https://cryptopanic.com/api/free/v1/posts/",
      {
        params: {
          auth_token: process.env.CRYPTOPANIC_API_KEY,
          public: true,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        message: "Error fetching data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
