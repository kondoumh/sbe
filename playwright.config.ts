import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "test",
  testMatch: "**/?(*.)+(spec|test).[tj]s?(x)",
});
