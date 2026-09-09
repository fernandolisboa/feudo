import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set; skipping integration tests.");
  process.exit(0);
}

const result = spawnSync("vitest", ["run", "--config", "vitest.integration.config.mts"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
