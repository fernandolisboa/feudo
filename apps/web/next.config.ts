import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {};

const publicDir = path.join(process.cwd(), "public");

// Setting additionalPrecacheEntries replaces Serwist's own scan of public/,
// so the public files are listed here the same way it would list them.
function publicFileEntries(): { url: string; revision: string }[] {
  return readdirSync(publicDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !/^(sw\.js|swe-worker-.*\.js)(\.map)?$/.test(entry.name))
    .map((entry) => {
      const absolute = path.join(entry.parentPath, entry.name);
      return {
        url: `/${path.relative(publicDir, absolute).split(path.sep).join("/")}`,
        revision: createHash("md5").update(readFileSync(absolute)).digest("hex"),
      };
    });
}

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    ...publicFileEntries(),
    { url: "/sem-conexao", revision: process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID() },
  ],
});

export default withSerwist(nextConfig);
