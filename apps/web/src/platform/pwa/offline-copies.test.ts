import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearOfflineCopies,
  deleteForeignCaches,
  isClearOfflineCopiesMessage,
  isOfflineCopyScreen,
  OFFLINE_COPIES_SCOPE_KEY,
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
  vi.unstubAllGlobals();
});

describe("clearOfflineCopies", () => {
  it("deletes the copies and every leftover cache, keeping only build assets", async () => {
    await clearOfflineCopies();
    expect([...names].sort()).toEqual([PRECACHE, STATIC_ASSETS_CACHE].sort());
  });

  it("forgets whose copies this browser held", async () => {
    const removeItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { removeItem } });
    await clearOfflineCopies();
    expect(removeItem).toHaveBeenCalledWith(OFFLINE_COPIES_SCOPE_KEY);
  });

  it("waits for the service worker to clear too, so a page it is still fetching is not kept", async () => {
    const order: string[] = [];
    const controller = {
      postMessage: (message: unknown, [port]: MessagePort[]) => {
        expect(isClearOfflineCopiesMessage(message)).toBe(true);
        setTimeout(() => {
          order.push("worker cleared");
          port?.postMessage("cleared");
        }, 10);
      },
    };
    vi.stubGlobal("navigator", { serviceWorker: { controller } });

    await clearOfflineCopies();
    order.push("resolved");

    expect(order).toEqual(["worker cleared", "resolved"]);
  });

  it("does not hang when the service worker never answers", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", { serviceWorker: { controller: { postMessage: vi.fn() } } });
    const cleared = clearOfflineCopies();
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(cleared).resolves.toBeUndefined();
    vi.useRealTimers();
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

describe("isClearOfflineCopiesMessage", () => {
  it("accepts only the clear message", () => {
    expect(isClearOfflineCopiesMessage({ type: "FEUDO_CLEAR_OFFLINE_COPIES" })).toBe(true);
    expect(isClearOfflineCopiesMessage({ type: "CACHE_URLS" })).toBe(false);
    expect(isClearOfflineCopiesMessage("FEUDO_CLEAR_OFFLINE_COPIES")).toBe(false);
    expect(isClearOfflineCopiesMessage(null)).toBe(false);
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
