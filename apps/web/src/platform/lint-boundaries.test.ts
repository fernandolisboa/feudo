import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ESLint } from "eslint";
import { afterEach, describe, expect, it } from "vitest";

const WEB_ROOT = path.resolve(import.meta.dirname, "../..");

const eslint = new ESLint({
  cwd: WEB_ROOT,
  overrideConfigFile: path.join(WEB_ROOT, "eslint.config.mjs"),
});

const writtenFiles: string[] = [];

afterEach(async () => {
  await Promise.all(writtenFiles.splice(0).map((file) => rm(file, { force: true })));
});

async function lint(relativePath: string, source: string): Promise<ESLint.LintResult> {
  const absolutePath = path.join(WEB_ROOT, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, source);
  writtenFiles.push(absolutePath);

  const [result] = await eslint.lintText(source, { filePath: relativePath });
  if (!result) {
    throw new Error(`ESLint returned no result for ${relativePath}`);
  }
  return result;
}

function restrictedImportMessages(result: ESLint.LintResult) {
  return result.messages.filter((message) => message.ruleId === "no-restricted-imports");
}

describe("ADR-0011 slice boundaries", () => {
  describe("rule 1: a slice is reached only through its index or its schema", () => {
    it("errors when a file outside the slice imports one of its internal files", async () => {
      const result = await lint(
        "src/platform/__fixture-rule1-violation__.ts",
        'import { getAuth } from "@/modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows importing the slice's index and its schema", async () => {
      const result = await lint(
        "src/platform/__fixture-rule1-allowed__.ts",
        'import { getAuth } from "@/modules/auth";\nimport { user } from "@/modules/auth/schema";\nexport const marker = { getAuth, user };\n',
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });

    it("allows a test file to import another slice's test helpers", async () => {
      const result = await lint(
        "src/platform/__fixture-rule1-test-helper__.test.ts",
        'import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";\nexport const marker = signUpVerifiedUser;\n',
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });

    it("errors when a non-test file imports another slice's test helpers", async () => {
      const result = await lint(
        "src/platform/__fixture-rule1-test-helper-outside-test__.ts",
        'import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";\nexport const marker = signUpVerifiedUser;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when a file inside one slice reaches into another slice with a relative import", async () => {
      const result = await lint(
        "src/modules/households/__fixture-rule1-relative-violation__.ts",
        'import { getAuth } from "../auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows a same-slice relative import", async () => {
      const result = await lint(
        "src/modules/households/__fixture-rule1-relative-allowed__.ts",
        'import { requireHouseholdSession } from "./require-household-session";\nexport const marker = requireHouseholdSession;\n',
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });

    it("allows a schema.ts file to import another slice's schema.ts relatively, with the .ts extension", async () => {
      const result = await lint(
        "src/modules/theme/schema.ts",
        'import { organization } from "../households/schema.ts";\nexport const marker = organization;\n',
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });

    it("errors when a schema.ts file reaches into another slice's non-schema file relatively", async () => {
      const result = await lint(
        "src/modules/theme/schema.ts",
        'import { getAuth } from "../auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });
  });

  describe("rule 2: app/ imports only through aliases, never relatively out of its folder", () => {
    it("errors on a relative import that leaves the current folder", async () => {
      const result = await lint(
        "src/app/__fixture-rule2-relative-escape__.ts",
        'import { cn } from "../lib/utils";\nexport const marker = cn;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when app/ reaches into a slice's internals", async () => {
      const result = await lint(
        "src/app/__fixture-rule2-slice-internal__.ts",
        'import { getAuth } from "@/modules/auth/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows app/ to import through the modules, ui, platform and lib aliases", async () => {
      const result = await lint(
        "src/app/__fixture-rule2-allowed__.ts",
        [
          'import { cn } from "@/lib/utils";',
          'import { getAuth } from "@/modules/auth";',
          'import { getDb } from "@/platform/db/client";',
          'import { Button } from "@/ui/button";',
          "export const marker = { cn, getAuth, getDb, Button };",
          "",
        ].join("\n"),
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });
  });

  describe("rule 3: modules, platform, ui and lib never import app/", () => {
    it("errors when platform/ imports from app/", async () => {
      const result = await lint(
        "src/platform/__fixture-rule3-violation__.ts",
        'import RootLayout from "@/app/layout";\nexport const marker = RootLayout;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows platform/ to import from modules/", async () => {
      const result = await lint(
        "src/platform/__fixture-rule3-allowed__.ts",
        'import { getAuth } from "@/modules/auth";\nexport const marker = getAuth;\n',
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });
  });

  describe("rule 4: ui/ and lib/ never import modules/ or platform/", () => {
    it("errors when ui/ imports from modules/, even through its index", async () => {
      const result = await lint(
        "src/ui/__fixture-rule4-modules-violation__.ts",
        'import { getAuth } from "@/modules/auth";\nexport const marker = getAuth;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("errors when lib/ imports from platform/", async () => {
      const result = await lint(
        "src/lib/__fixture-rule4-platform-violation__.ts",
        'import { getDb } from "@/platform/db/client";\nexport const marker = getDb;\n',
      );

      const messages = restrictedImportMessages(result);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain("ADR-0011");
    });

    it("allows ui/ and lib/ to import each other", async () => {
      const result = await lint(
        "src/ui/__fixture-rule4-allowed__.ts",
        'import { cn } from "@/lib/utils";\nimport { Button } from "@/ui/button";\nexport const marker = { cn, Button };\n',
      );

      expect(restrictedImportMessages(result)).toHaveLength(0);
    });
  });
});
