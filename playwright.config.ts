import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        baseURL: "http://localhost:3000",
      },
    },
  ],
});
