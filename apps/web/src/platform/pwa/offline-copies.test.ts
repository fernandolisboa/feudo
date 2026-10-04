import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearOfflineCopies,
  deleteForeignCaches,
  isOfflineCopyScreen,
  OFFLINE_COPIES_CACHE,
  STATIC_ASSETS_CACHE,
} from "./offline-copies";

const PRECACHE = "serwist-precache-v2-https://feudo.vercel.app/";
// What the Serwist default cache left in browsers before #28 (#116).
const LEGACY = ["pages", "pages-rsc", "pages-rsc-prefetch", "others", "apis", "next-data"];

let names: Set<string>;

beforeEach(() => {
  names = new Set([PRECACHE, STATIC_ASSETS_CACHE, OFFLINE_COPIES_CACHE, ...LEGACY]);
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      keys: () => Promise.resolve([...names]),
      delete: (name: string) => Promise.resolve(names.delete(name)),
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "caches");
});

describe("clearOfflineCopies", () => {
  it("deletes the copies and every leftover cache, keeping only build assets", async () => {
    await clearOfflineCopies();
    expect([...names].sort()).toEqual([PRECACHE, STATIC_ASSETS_CACHE].sort());
  });

  it("does nothing where the browser has no Cache Storage", async () => {
    Reflect.deleteProperty(globalThis, "caches");
    await expect(clearOfflineCopies()).resolves.toBeUndefined();
  });
});

describe("deleteForeignCaches", () => {
  it("keeps the copies across a service worker update but drops the legacy caches", async () => {
    await deleteForeignCaches();
    expect([...names].sort()).toEqual([PRECACHE, STATIC_ASSETS_CACHE, OFFLINE_COPIES_CACHE].sort());
  });
});

describe("isOfflineCopyScreen", () => {
  it.each(["/", "/transacoes", "/reserva", "/bancos", "/casa", "/categorias", "/como-usar"])(
    "keeps a copy of %s",
    (path) => {
      expect(isOfflineCopyScreen(path)).toBe(true);
    },
  );

  it.each(["/preferencias", "/conectar-banco", "/entrar", "/api/export", "/transacoes/x"])(
    "keeps no copy of %s",
    (path) => {
      expect(isOfflineCopyScreen(path)).toBe(false);
    },
  );
});
