import { readdirSync } from "node:fs";
import path from "node:path";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const ADR = "ADR-0011";

const slices = readdirSync(path.join(import.meta.dirname, "src/modules"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const slicesAlternation = slices.join("|");

const MESSAGES = {
  sliceInternal: `${ADR}: import a slice only through its index ("@/modules/<slice>") or its schema ("@/modules/<slice>/schema"); everything else is private to the slice (tests may also reach "@/modules/<slice>/test").`,
  relativeCrossSlice: `${ADR}: reach another slice through its "@/modules/<slice>" alias, not a relative import.`,
  relativeSchemaOnly: `${ADR}: a schema.ts file may only reach another slice relatively through its schema.ts ("../<slice>/schema.ts"); use the "@/modules/<slice>" alias for anything else.`,
  appRelativeEscape: `${ADR}: "app/" is routing only; reach modules, ui, platform and lib through their aliases, not a relative import that leaves the current folder.`,
  noAppImport: `${ADR}: "app/" depends on modules, platform, ui and lib, never the other way around; do not import "@/app/**" from here.`,
  uiLibNoDomain: `${ADR}: "ui/" and "lib/" hold no domain logic; do not import "@/modules/**" or "@/platform/**" from here.`,
};

const aliasRegularPattern = {
  regex: `^@/modules/(${slicesAlternation})/(?!schema(\\.ts)?$)`,
  message: MESSAGES.sliceInternal,
};

const aliasTestPattern = {
  regex: `^@/modules/(${slicesAlternation})/(?!schema(\\.ts)?$)(?!test($|/))`,
  message: MESSAGES.sliceInternal,
};

// A slice's own name can collide with one of its own files (e.g. "auth/auth.ts"),
// so the relative-import patterns below only ever look at the *other* slices, per
// current slice, never at the slice a file already lives in.
function otherSlicesAlternation(currentSlice) {
  return slices.filter((slice) => slice !== currentSlice).join("|");
}

function relativeBlanketPattern(currentSlice) {
  return {
    regex: `^(\\.\\./)+(${otherSlicesAlternation(currentSlice)})(/|$)`,
    message: MESSAGES.relativeCrossSlice,
  };
}

function relativeSchemaExceptionPattern(currentSlice) {
  return {
    regex: `^\\.\\./(${otherSlicesAlternation(currentSlice)})/(?!schema\\.ts$)`,
    message: MESSAGES.relativeSchemaOnly,
  };
}

const noAppImportPattern = {
  regex: "^@/app/",
  message: MESSAGES.noAppImport,
};

const noRelativeEscapePattern = {
  regex: "^\\.\\./",
  message: MESSAGES.appRelativeEscape,
};

const blockModulesPattern = {
  regex: "^@/modules/",
  message: MESSAGES.uiLibNoDomain,
};

const blockPlatformPattern = {
  regex: "^@/platform/",
  message: MESSAGES.uiLibNoDomain,
};

function restrictImports(patterns) {
  return { "no-restricted-imports": ["error", { patterns }] };
}

const APP_TEST_LIKE_FILES = ["src/app/**/*.test.ts", "src/app/**/*.test.tsx"];
const PLATFORM_TEST_LIKE_FILES = ["src/platform/**/*.test.ts", "src/platform/**/*.test.tsx"];

function moduleBoundaryConfigs(slice) {
  const schemaFile = `src/modules/${slice}/schema.ts`;
  const testLikeFiles = [
    `src/modules/${slice}/**/*.test.ts`,
    `src/modules/${slice}/**/*.test.tsx`,
    `src/modules/${slice}/test/**/*.ts`,
    `src/modules/${slice}/test/**/*.tsx`,
  ];
  const others = slices.filter((other) => other !== slice);
  const relativePatterns =
    others.length > 0
      ? {
          blanket: relativeBlanketPattern(slice),
          schemaException: relativeSchemaExceptionPattern(slice),
        }
      : { blanket: null, schemaException: null };

  const configs = [
    // ADR-0011 rule 1 (this slice's schema.ts): may reach another slice's
    // schema.ts relatively with the .ts extension; everything else follows
    // the regular index/schema-only restriction, plus rule 3.
    {
      files: [schemaFile],
      rules: restrictImports(
        [aliasRegularPattern, relativePatterns.schemaException, noAppImportPattern].filter(Boolean),
      ),
    },

    // ADR-0011 rule 1 (this slice's test files and test/ helpers): may reach
    // another slice's test/ helpers, plus the blanket relative-import ban
    // and rule 3.
    {
      files: testLikeFiles,
      ignores: [schemaFile],
      rules: restrictImports(
        [aliasTestPattern, relativePatterns.blanket, noAppImportPattern].filter(Boolean),
      ),
    },

    // ADR-0011 rule 1 (this slice's regular files): index/schema-only
    // restriction, the blanket relative-import ban, plus rule 3.
    {
      files: [`src/modules/${slice}/**/*.ts`, `src/modules/${slice}/**/*.tsx`],
      ignores: [schemaFile, ...testLikeFiles],
      rules: restrictImports(
        [aliasRegularPattern, relativePatterns.blanket, noAppImportPattern].filter(Boolean),
      ),
    },
  ];

  return configs;
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ["src/app/sw.ts", "playwright.config.ts", "e2e/**/*.ts", "drizzle.config.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  ...slices.flatMap(moduleBoundaryConfigs),

  // ADR-0011 rule 2 (app/ test files): the index/schema-only restriction
  // (with the test/ exception) and no relative import leaving the folder.
  {
    files: APP_TEST_LIKE_FILES,
    rules: restrictImports([aliasTestPattern, noRelativeEscapePattern]),
  },

  // ADR-0011 rule 2 (app/ regular files): same as above, without the test/
  // exception.
  {
    files: ["src/app/**/*.ts", "src/app/**/*.tsx"],
    ignores: APP_TEST_LIKE_FILES,
    rules: restrictImports([aliasRegularPattern, noRelativeEscapePattern]),
  },

  // e2e/** gets the same index/schema-only restriction (rule 1's exception
  // for e2e reaching a slice's test/ helpers); it is outside src/app/**, so
  // rule 2's relative-import ban does not apply and rule 3 does not either.
  {
    files: ["e2e/**/*.ts", "e2e/**/*.tsx"],
    rules: restrictImports([aliasTestPattern]),
  },

  // ADR-0011 rule 3 (platform/ test files): index/schema-only restriction
  // (with the test/ exception) plus never importing app/.
  {
    files: PLATFORM_TEST_LIKE_FILES,
    rules: restrictImports([aliasTestPattern, noAppImportPattern]),
  },

  // ADR-0011 rule 3 (platform/ regular files): same, without the test/
  // exception.
  {
    files: ["src/platform/**/*.ts", "src/platform/**/*.tsx"],
    ignores: PLATFORM_TEST_LIKE_FILES,
    rules: restrictImports([aliasRegularPattern, noAppImportPattern]),
  },

  // ADR-0011 rules 3 and 4: ui/ and lib/ never import app/, modules/ or
  // platform/ at all, test files included; this is stricter than the
  // index/schema-only restriction, so it stands on its own.
  {
    files: ["src/ui/**/*.ts", "src/ui/**/*.tsx", "src/lib/**/*.ts", "src/lib/**/*.tsx"],
    rules: restrictImports([noAppImportPattern, blockModulesPattern, blockPlatformPattern]),
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "drizzle/**",
    ".generated/**",
  ]),
]);

export default eslintConfig;
