import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      ...configDefaults.exclude,
      "src/**/*.integration.test.{ts,tsx}",
      "**/__fixture*__/**",
    ],
    environment: "node",
  },
});
