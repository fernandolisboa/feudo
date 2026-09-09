import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.integration.test.ts"],
    environment: "node",
    fileParallelism: false,
    // Default 5000ms is too tight for tests that make many sequential round
    // trips to a real, remote Postgres project (several already ran past
    // 4s in CI before this); 20s gives headroom without masking a genuinely
    // hung test.
    testTimeout: 20000,
  },
});
