import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin",
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  use: { baseURL: "http://127.0.0.1:4180", trace: "retain-on-failure" },
  reporter: "list",
});
