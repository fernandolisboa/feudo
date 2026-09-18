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
  relativeEscape: `${ADR}: reach another slice, "app/" or "platform/" through its alias, not a relative import.`,
  relativeSchemaOnly: `${ADR}: a schema.ts file may only reach another slice relatively through its schema.ts ("../<slice>/schema.ts"); use the "@/modules/<slice>" alias for anything else.`,
  appRelativeEscape: `${ADR}: "app/" is routing only; reach modules, ui, platform and lib through their aliases, not a relative import that leaves the current folder.`,
  noAppImport: `${ADR}: "app/" depends on modules, platform, ui and lib, never the other way around; do not import "@/app/**" from here.`,
  appSharesNothing: `${ADR}: app/ files wire a URL to a slice and share nothing between routes; do not import "@/app/**" from here.`,
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
// so every relative-escape pattern below is built from the *other* slices for a
// given current slice, never from the slice a file already lives in.
function otherSlicesAlternation(currentSlice) {
  return slices.filter((slice) => slice !== currentSlice).join("|");
}

// Forbids a relative import that, after any number of "./" and "../" segments,
// names one of `forbiddenNames` — either another slice, or the top-level
// "modules"/"app"/"platform" segments a slice, platform, ui or lib file can
// only ever reach by escaping past its own folder (none of those folders has a
// real subfolder with those names). `schemaException` additionally allows the
// one sanctioned case: "<forbidden>/schema.ts" exactly.
function relativeEscapePattern(forbiddenNames, { schemaException = false } = {}) {
  const names = forbiddenNames.join("|");
  if (schemaException) {
    return {
      regex: `^(\\./)*(\\.\\./)+(${names})($|/(?!schema\\.ts$))`,
      message: MESSAGES.relativeSchemaOnly,
    };
  }
  return {
    regex: `^(\\./)*(\\.\\./)+(${names})(/|$)`,
    message: MESSAGES.relativeEscape,
  };
}

// platform/db/schema.ts is the one sanctioned exception to "platform never
// reaches modules relatively": it re-exports every slice's schema.ts so
// drizzle-kit and the reset scripts can load the whole schema graph under
// plain Node, which has no path aliases (ADR-0011). Anything else relative
// under "modules/" or "app/" is still forbidden.
const platformSchemaModulesPattern = {
  regex: `^(\\./)*(\\.\\./)+modules(?!/(${slicesAlternation})/schema\\.ts$)(/|$)`,
  message: MESSAGES.relativeSchemaOnly,
};

const platformSchemaAppPattern = {
  regex: "^(\\./)*(\\.\\./)+app(/|$)",
  message: MESSAGES.relativeEscape,
};

const noAppImportPattern = {
  regex: "^@/app/",
  message: MESSAGES.noAppImport,
};

const noAppSelfImportPattern = {
  regex: "^@/app/",
  message: MESSAGES.appSharesNothing,
};

const noRelativeEscapePattern = {
  regex: "^(\\./)*\\.\\./",
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

// A dynamic import() bypasses no-restricted-imports entirely, so every
// pattern is also enforced as a no-restricted-syntax selector against the
// literal argument of an ImportExpression. Escape "/" for the esquery
// attribute-regex delimiter; the pattern's own regex syntax (lookaheads,
// backslash escapes) carries over unchanged.
function toDynamicImportSelector(regexSource) {
  return `ImportExpression > Literal[value=/${regexSource.replace(/\//g, "\\/")}/]`;
}

function restrictImports(patterns) {
  return {
    "no-restricted-imports": ["error", { patterns }],
    "no-restricted-syntax": [
      "error",
      ...patterns.map((pattern) => ({
        selector: toDynamicImportSelector(pattern.regex),
        message: pattern.message,
      })),
    ],
  };
}

const MODULES_AND_APP_SEGMENTS = ["modules", "app"];
const MODULES_APP_AND_PLATFORM_SEGMENTS = ["modules", "app", "platform"];

const APP_TEST_LIKE_FILES = ["src/app/**/*.test.ts", "src/app/**/*.test.tsx"];
const PLATFORM_TEST_LIKE_FILES = ["src/platform/**/*.test.ts", "src/platform/**/*.test.tsx"];
const PLATFORM_SCHEMA_FILE = "src/platform/db/schema.ts";

function moduleBoundaryConfigs(slice) {
  const schemaFile = `src/modules/${slice}/schema.ts`;
  const testLikeFiles = [
    `src/modules/${slice}/**/*.test.ts`,
    `src/modules/${slice}/**/*.test.tsx`,
    `src/modules/${slice}/test/**/*.ts`,
    `src/modules/${slice}/test/**/*.tsx`,
  ];
  const forbiddenNames = [...otherSlicesAlternation(slice).split("|"), ...MODULES_AND_APP_SEGMENTS];

  return [
    {
      files: [schemaFile],
      rules: restrictImports([
        aliasRegularPattern,
        relativeEscapePattern(forbiddenNames, { schemaException: true }),
        noAppImportPattern,
      ]),
    },
    {
      files: testLikeFiles,
      ignores: [schemaFile],
      rules: restrictImports([
        aliasTestPattern,
        relativeEscapePattern(forbiddenNames),
        noAppImportPattern,
      ]),
    },
    {
      files: [`src/modules/${slice}/**/*.ts`, `src/modules/${slice}/**/*.tsx`],
      ignores: [schemaFile, ...testLikeFiles],
      rules: restrictImports([
        aliasRegularPattern,
        relativeEscapePattern(forbiddenNames),
        noAppImportPattern,
      ]),
    },
  ];
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
        projectService: {
          // apps/web/tsconfig.json excludes __fixture*__ paths so a leftover
          // fixture from an aborted test run cannot break `tsc --noEmit`;
          // this lets ESLint's own type-aware parsing still service the
          // handful of fixture files apps/web/src/platform/lint-boundaries.test.ts
          // writes while it runs.
          allowDefaultProject: [
            "src/modules/__fixture_a__/*.ts",
            "src/modules/__fixture_a__/test/*.ts",
            "src/modules/__fixture_b__/*.ts",
            "src/modules/__fixture_b__/test/*.ts",
            "src/app/__fixture__/*.ts",
            "src/platform/__fixture__/*.ts",
            "src/ui/__fixture__/*.ts",
            "src/lib/__fixture__/*.ts",
            "src/__fixture_root__.ts",
          ],
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 200,
        },
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

  {
    files: APP_TEST_LIKE_FILES,
    rules: restrictImports([aliasTestPattern, noRelativeEscapePattern, noAppSelfImportPattern]),
  },
  {
    files: ["src/app/**/*.ts", "src/app/**/*.tsx"],
    ignores: APP_TEST_LIKE_FILES,
    rules: restrictImports([aliasRegularPattern, noRelativeEscapePattern, noAppSelfImportPattern]),
  },

  // e2e/** sits outside src/, so only rule 1's index/schema-only restriction
  // (with the test exception) applies here.
  {
    files: ["e2e/**/*.ts", "e2e/**/*.tsx"],
    rules: restrictImports([aliasTestPattern]),
  },

  {
    files: [PLATFORM_SCHEMA_FILE],
    rules: restrictImports([
      aliasRegularPattern,
      platformSchemaModulesPattern,
      platformSchemaAppPattern,
      noAppImportPattern,
    ]),
  },
  {
    files: PLATFORM_TEST_LIKE_FILES,
    ignores: [PLATFORM_SCHEMA_FILE],
    rules: restrictImports([
      aliasTestPattern,
      relativeEscapePattern(MODULES_AND_APP_SEGMENTS),
      noAppImportPattern,
    ]),
  },
  {
    files: ["src/platform/**/*.ts", "src/platform/**/*.tsx"],
    ignores: [PLATFORM_SCHEMA_FILE, ...PLATFORM_TEST_LIKE_FILES],
    rules: restrictImports([
      aliasRegularPattern,
      relativeEscapePattern(MODULES_AND_APP_SEGMENTS),
      noAppImportPattern,
    ]),
  },

  // ui/ and lib/ ban modules/, app/ and platform/ outright (alias, relative
  // and dynamic import alike), which is stricter than the index/schema-only
  // restriction, so they do not need that restriction too.
  {
    files: ["src/ui/**/*.ts", "src/ui/**/*.tsx", "src/lib/**/*.ts", "src/lib/**/*.tsx"],
    rules: restrictImports([
      noAppImportPattern,
      blockModulesPattern,
      blockPlatformPattern,
      relativeEscapePattern(MODULES_APP_AND_PLATFORM_SEGMENTS),
    ]),
  },

  // A future src/middleware.ts or src/instrumentation.ts is outside every
  // block above, so it gets the same index/schema-only and app-import
  // restrictions as any other non-slice, non-app file.
  {
    files: ["src/*.ts", "src/*.tsx"],
    rules: restrictImports([aliasRegularPattern, noAppImportPattern]),
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
