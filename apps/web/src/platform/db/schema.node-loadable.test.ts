import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("platform/db/schema.ts under plain Node", () => {
  it("loads without needing the @/ path alias, since drizzle-kit and the reset scripts import it under plain Node", () => {
    const schemaPath = path.resolve(import.meta.dirname, "./schema.ts");
    const result = spawnSync(
      process.execPath,
      [
        "--no-warnings",
        "--input-type=module",
        "-e",
        `import(${JSON.stringify(`file://${schemaPath}`)})`,
      ],
      { cwd: path.resolve(import.meta.dirname, "../../.."), encoding: "utf8" },
    );

    expect(result.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
    expect(result.status).toBe(0);
  });
});
