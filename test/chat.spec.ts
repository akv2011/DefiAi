import { expect, test } from "@playwright/test";

test.describe("Chat Response Stream Handling", () => {
  test('handles response stream without "body stream already read" error', async ({
    page,
  }) => {
    // Mock of  the API request
    await page.route("/api/chat", async route => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: `data: ${JSON.stringify({ content: "Test response" })}\n\n`,
      });
    });

    // Navigating  to chat page
    await page.goto("http://localhost:3000/chat");

    // Track of console errors
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Waiting for page to be ready
    await page.waitForLoadState("networkidle");

    // Trigger of  the chat response
    await page.evaluate(() => {
      fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "test",
        }),
      });
    });

    // Wait function  to capture any potential stream errors
    await page.waitForTimeout(2000);

    // Verification of  no stream errors occurred
    const hasStreamError = consoleErrors.some(error =>
      error.includes("body stream already read")
    );
    expect(hasStreamError).toBe(false);
  });
});
