import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 20_000 });

const WEB_ROOT = path.resolve(import.meta.dirname, "../..");

const FIXTURE_DIRS = [
  "src/modules/__fixture_a__/test",
  "src/modules/__fixture_b__/test",
  "src/app/__fixture__",
  "src/platform/__fixture__",
  "src/ui/__fixture__",
  "src/lib/__fixture__",
];

// Mirrors "auth/auth.ts": a slice whose own name collides with one of its
// files, so a same-slice relative import must never be mistaken for a
// cross-slice one.
const COLLISION_FILE = "src/modules/__fixture_a__/__fixture_a__.ts";

let eslint: ESLint;
const writtenFiles: string[] = [];

beforeAll(async () => {
  for (const dir of FIXTURE_DIRS) {
    await mkdir(path.join(WEB_ROOT, dir), { recursive: true });
  }
  await writeFile(path.join(WEB_ROOT, COLLISION_FILE), 'export const marker = "a";\n');

  eslint = new ESLint({
    cwd: WEB_ROOT,
    overrideConfigFile: path.join(WEB_ROOT, "eslint.config.mjs"),
  });

  // Pays the TypeScript project-service start-up cost here, once, instead of
  // inside the first real test case below: on a slower CI runner that
  // start-up alone can exceed the per-test timeout.
  await lint("src/app/__fixture__/warmup.ts", 'import "@/modules/__fixture_a__";\n');
}, 60_000);

afterAll(async () => {
  await Promise.all([
    rm(path.join(WEB_ROOT, "src/modules/__fixture_a__"), { recursive: true, force: true }),
    rm(path.join(WEB_ROOT, "src/modules/__fixture_b__"), { recursive: true, force: true }),
    rm(path.join(WEB_ROOT, "src/app/__fixture__"), { recursive: true, force: true }),
    rm(path.join(WEB_ROOT, "src/platform/__fixture__"), { recursive: true, force: true }),
    rm(path.join(WEB_ROOT, "src/ui/__fixture__"), { recursive: true, force: true }),
    rm(path.join(WEB_ROOT, "src/lib/__fixture__"), { recursive: true, force: true }),
    rm(path.join(WEB_ROOT, "src/__fixture_root__.ts"), { force: true }),
  ]);
});

afterEach(async () => {
  await Promise.all(writtenFiles.splice(0).map((file) => rm(file, { force: true })));
});

async function lint(relativePath: string, source: string): Promise<ESLint.LintResult> {
  const absolutePath = path.join(WEB_ROOT, relativePath);
  if (existsSync(absolutePath)) {
    throw new Error(`refusing to overwrite an existing file: ${relativePath}`);
  }
  await writeFile(absolutePath, source);
  writtenFiles.push(absolutePath);

  const [result] = await eslint.lintText(source, { filePath: relativePath });
  if (!result) {
    throw new Error(`ESLint returned no result for ${relativePath}`);
  }
  return result;
}

async function lintExistingFile(relativePath: string): Promise<ESLint.LintResult> {
  const source = await readFile(path.join(WEB_ROOT, relativePath), "utf8");
  const [result] = await eslint.lintText(source, { filePath: relativePath });
  if (!result) {
    throw new Error(`ESLint returned no result for ${relativePath}`);
  }
  return result;
}

function restrictedMessages(result: ESLint.LintResult, ruleId: string) {
  return result.messages.filter((message) => message.ruleId === ruleId);
}

function boundaryMessages(result: ESLint.LintResult) {
  return result.messages.filter(
    (message) =>
      message.ruleId === "no-restricted-imports" || message.ruleId === "no-restricted-syntax",
  );
}

describe("ADR-0011 slice boundaries", () => {
  describe("rule 1: a slice is reached only through its index or its schema", () => {
    it("errors when a file outside the slice imports one of its internal files", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule1-violation.ts",
        'import { getAuth } from "@/modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows importing the slice's index and its schema", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule1-allowed.ts",
        'import { getAuth } from "@/modules/auth";\nimport { user } from "@/modules/auth/schema";\nexport const marker = { getAuth, user };\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("allows a test file to import another slice's test helpers", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule1-test-helper.test.ts",
        'import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";\nexport const marker = signUpVerifiedUser;\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("errors when a non-test file imports another slice's test helpers", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule1-test-helper-outside-test.ts",
        'import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";\nexport const marker = signUpVerifiedUser;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when a file inside one slice reaches into another slice with a relative import", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/rule1-relative-violation.ts",
        'import { getAuth } from "../auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows a same-slice relative import, even when the target's name matches the slice's own name", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/test/rule1-relative-allowed.ts",
        'import { marker } from "../__fixture_a__";\nexport const reexported = marker;\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("allows a schema.ts file to import another slice's schema.ts relatively, with the .ts extension", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/schema.ts",
        'import { organization } from "../households/schema.ts";\nexport const marker = organization;\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("errors when a schema.ts file reaches into another slice's non-schema file relatively", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/schema.ts",
        'import { getAuth } from "../auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors on a bare relative import naming another slice from a schema.ts file", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/schema.ts",
        'import { user } from "../auth";\nexport const marker = user;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when a slice reaches another slice through the top-level modules/ segment", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/rule1-modules-segment-violation.ts",
        'import { getAuth } from "../../modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when a slice reaches app/ through the top-level app/ segment", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/rule1-app-segment-violation.ts",
        'import RootLayout from "../../app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors on a leading ./ before the relative escape", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/rule1-leading-dot-violation.ts",
        'import { getAuth } from "./../auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors on a dynamic import reaching cross-slice into another slice's internals", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/rule1-dynamic-violation.ts",
        'export async function load() {\n  return import("@/modules/households/service");\n}\n',
      );

      const messages = restrictedMessages(result, "no-restricted-syntax");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });
  });

  describe("rule 2: app/ imports only through aliases, never relatively out of its folder", () => {
    it("errors on a relative import that leaves the current folder", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-relative-escape.ts",
        'import { cn } from "../lib/utils";\nexport const marker = cn;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors on a relative import prefixed with a leading ./", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-leading-dot-violation.ts",
        'import { cn } from "./../../lib/utils";\nexport const marker = cn;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when app/ reaches into a slice's internals", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-slice-internal.ts",
        'import { getAuth } from "@/modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when app/ imports another app/ route directly", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-app-import-violation.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
      expect(messages[0]?.message).toContain("share nothing between routes");
    });

    it("errors on a dynamic import reaching a slice's internals from app/", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-dynamic-violation.ts",
        'export async function load() {\n  return import("@/modules/auth/auth");\n}\n',
      );

      const messages = restrictedMessages(result, "no-restricted-syntax");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows a dynamic import of a slice's index from app/", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-dynamic-allowed.ts",
        'export async function load() {\n  return import("@/modules/auth");\n}\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("allows app/ to import through the modules, ui, platform and lib aliases", async () => {
      const result = await lint(
        "src/app/__fixture__/rule2-allowed.ts",
        [
          'import { cn } from "@/lib/utils";',
          'import { getAuth } from "@/modules/auth";',
          'import { getDb } from "@/platform/db/client";',
          'import { Button } from "@/ui/button";',
          "export const marker = { cn, getAuth, getDb, Button };",
          "",
        ].join("\n"),
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("still lints clean for the real cron daily route test's vi.mock of a slice index", async () => {
      const result = await lintExistingFile("src/app/api/cron/daily/route.test.ts");

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("still lints clean for the real health route test's vi.mock of a slice index", async () => {
      const result = await lintExistingFile("src/app/api/health/route.test.ts");

      expect(boundaryMessages(result)).toHaveLength(0);
    });
  });

  describe("rule 3: modules, platform, ui and lib never import app/", () => {
    it("errors when platform/ imports from app/", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule3-violation.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows platform/ to import from modules/", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule3-allowed.ts",
        'import { getAuth } from "@/modules/auth";\nexport const marker = getAuth;\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });

    it("errors when a slice imports from app/", async () => {
      const result = await lint(
        "src/modules/__fixture_a__/rule3-violation.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when ui/ imports from app/", async () => {
      const result = await lint(
        "src/ui/__fixture__/rule3-violation.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when lib/ imports from app/", async () => {
      const result = await lint(
        "src/lib/__fixture__/rule3-violation.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when platform/ reaches modules/ through a relative segment escape", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule3-modules-segment-violation.ts",
        'import { getAuth } from "../modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when platform/ reaches app/ through a relative segment escape", async () => {
      const result = await lint(
        "src/platform/__fixture__/rule3-app-segment-violation.ts",
        'import RootLayout from "../../app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("still allows platform/db/schema.ts to reach every slice's schema.ts relatively", async () => {
      const result = await lintExistingFile("src/platform/db/schema.ts");

      expect(boundaryMessages(result)).toHaveLength(0);
    });
  });

  describe("rule 4: ui/ and lib/ never import modules/ or platform/", () => {
    it("errors when ui/ imports from modules/, even through its index", async () => {
      const result = await lint(
        "src/ui/__fixture__/rule4-modules-violation.ts",
        'import { getAuth } from "@/modules/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when lib/ imports from platform/", async () => {
      const result = await lint(
        "src/lib/__fixture__/rule4-platform-violation.ts",
        'import { getDb } from "@/platform/db/client";\nexport const marker = getDb;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when ui/ reaches modules/ through a relative segment escape", async () => {
      const result = await lint(
        "src/ui/__fixture__/rule4-modules-relative-violation.ts",
        'import { getAuth } from "../modules/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when lib/ reaches platform/ through a relative segment escape", async () => {
      const result = await lint(
        "src/lib/__fixture__/rule4-platform-relative-violation.ts",
        'import { getDb } from "../platform/db/client";\nexport const marker = getDb;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors on a dynamic import of modules/ from ui/", async () => {
      const result = await lint(
        "src/ui/__fixture__/rule4-dynamic-violation.ts",
        'export async function load() {\n  return import("@/modules/auth");\n}\n',
      );

      const messages = restrictedMessages(result, "no-restricted-syntax");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows ui/ and lib/ to import each other", async () => {
      const result = await lint(
        "src/ui/__fixture__/rule4-allowed.ts",
        'import { cn } from "@/lib/utils";\nimport { Button } from "@/ui/button";\nexport const marker = { cn, Button };\n',
      );

      expect(boundaryMessages(result)).toHaveLength(0);
    });
  });

  describe("catch-all: files at the src root", () => {
    it("errors when a root-level file reaches into a slice's internals", async () => {
      const result = await lint(
        "src/__fixture_root__.ts",
        'import { getAuth } from "@/modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when a root-level file imports from app/", async () => {
      const result = await lint(
        "src/__fixture_root__.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedMessages(result, "no-restricted-imports");
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });
  });
});
