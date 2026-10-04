import type { RouteMatchCallback, RouteMatchCallbackOptions } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Strategy } from "serwist";
import { describe, expect, it } from "vitest";

import {
  OFFLINE_COPIES_CACHE,
  OFFLINE_FALLBACK_ROUTE,
  STATIC_ASSETS_CACHE,
} from "./offline-copies";
import {
  discardCopiesInFlight,
  offlineFallbacks,
  precacheOptions,
  runtimeCaching,
} from "./runtime-caching";

const ORIGIN = "https://feudo.test";

type FakeRequest = { mode: string; method: string; headers: Headers; url: string };

// Node's Request refuses mode "navigate", so the matchers get the three
// fields they read from a plain object instead.
function requestFor(
  path: string,
  { mode = "cors", headers = {} }: { mode?: string; headers?: Record<string, string> } = {},
): RouteMatchCallbackOptions {
  const url = new URL(path, ORIGIN);
  const request: FakeRequest = {
    mode,
    method: "GET",
    headers: new Headers(headers),
    url: url.href,
  };
  return {
    url,
    request: request as unknown as Request,
    sameOrigin: url.origin === ORIGIN,
    event: {} as ExtendableEvent,
  };
}

function ruleFor(options: RouteMatchCallbackOptions) {
  return runtimeCaching.find(({ matcher }) => (matcher as RouteMatchCallback)(options));
}

function cacheNameFor(options: RouteMatchCallbackOptions): string | null {
  const handler = ruleFor(options)?.handler;
  if (!handler || handler instanceof NetworkOnly) {
    return null;
  }
  return handler instanceof Strategy ? handler.cacheName : null;
}

const SCREENS = ["/", "/transacoes", "/reserva", "/bancos", "/casa", "/categorias", "/como-usar"];

describe("service worker runtime caching", () => {
  it("only uses function matchers, so every rule is checked by these tests", () => {
    for (const rule of runtimeCaching) {
      expect(typeof rule.matcher).toBe("function");
    }
  });

  it.each(SCREENS)("keeps the last rendered copy of %s in the offline-copies cache", (path) => {
    const navigation = requestFor(path, { mode: "navigate" });
    expect(ruleFor(navigation)?.handler).toBeInstanceOf(NetworkFirst);
    expect(cacheNameFor(navigation)).toBe(OFFLINE_COPIES_CACHE);
    expect(cacheNameFor(requestFor(path))).toBe(OFFLINE_COPIES_CACHE);
  });

  it("keeps a filtered screen under its own URL", () => {
    expect(cacheNameFor(requestFor("/transacoes?mes=2026-09", { mode: "navigate" }))).toBe(
      OFFLINE_COPIES_CACHE,
    );
  });

  it.each(SCREENS)("never stores the RSC payload of %s", (path) => {
    expect(cacheNameFor(requestFor(path, { headers: { RSC: "1" } }))).toBeNull();
    expect(
      cacheNameFor(requestFor(path, { headers: { RSC: "1", "Next-Router-Prefetch": "1" } })),
    ).toBeNull();
  });

  it.each([
    "/preferencias",
    "/conectar-banco",
    "/entrar",
    "/aceitar-termos",
    "/exclusao-agendada",
    "/convite/abc",
    "/privacidade",
  ])("never stores %s", (path) => {
    expect(cacheNameFor(requestFor(path, { mode: "navigate" }))).toBeNull();
  });

  it.each(["/api/export", "/api/health", "/api/auth/get-session", "/api/cron/daily"])(
    "never stores %s",
    (path) => {
      expect(ruleFor(requestFor(path))?.handler).toBeInstanceOf(NetworkOnly);
    },
  );

  it("caches hashed build assets, which are the same for every user", () => {
    const asset = requestFor("/_next/static/chunks/app-123.js");
    expect(ruleFor(asset)?.handler).toBeInstanceOf(CacheFirst);
    expect(cacheNameFor(asset)).toBe(STATIC_ASSETS_CACHE);
  });

  it("leaves cross-origin requests to the browser", () => {
    expect(ruleFor(requestFor("https://elsewhere.test/_next/static/x.js"))).toBeUndefined();
    expect(ruleFor(requestFor("https://elsewhere.test/transacoes"))).toBeUndefined();
  });

  it("stores responses only in the offline-copies cache or the build-asset cache", () => {
    const cacheNames = new Set(
      runtimeCaching
        .map(({ handler }) => handler)
        .filter((handler) => handler instanceof Strategy && !(handler instanceof NetworkOnly))
        .map((handler) => (handler as Strategy).cacheName),
    );
    expect([...cacheNames].sort()).toEqual([OFFLINE_COPIES_CACHE, STATIC_ASSETS_CACHE].sort());
  });

  it("finds a precached build asset under the address Vercel gives it (?dpl=)", () => {
    const ignored = precacheOptions.ignoreURLParametersMatching ?? [];
    expect(ignored.some((pattern) => pattern.test("dpl"))).toBe(true);
    expect(ignored.some((pattern) => pattern.test("mes"))).toBe(false);
  });

  it("falls back to the offline page for navigations only", () => {
    const [fallback] = offlineFallbacks.entries;
    expect(fallback?.url).toBe(OFFLINE_FALLBACK_ROUTE);
    const param = (mode: string) =>
      ({ request: { mode } as Request, error: new Error("offline") }) as Parameters<
        NonNullable<typeof fallback>["matcher"]
      >[0];
    expect(fallback?.matcher(param("navigate"))).toBe(true);
    expect(fallback?.matcher(param("cors"))).toBe(false);
  });
});

describe("what the offline-copies cache accepts", () => {
  const plugins = (
    runtimeCaching.find(
      ({ handler }) =>
        handler instanceof NetworkFirst && handler.cacheName === OFFLINE_COPIES_CACHE,
    )?.handler as NetworkFirst
  ).plugins;

  const request = new Request(`${ORIGIN}/transacoes`);
  const event = {} as ExtendableEvent;

  // Mirrors Serwist's StrategyHandler: one state object per plugin for the
  // whole handling of a request, handlerWillStart first.
  async function startHandling(): Promise<Map<(typeof plugins)[number], Record<string, unknown>>> {
    const states = new Map(plugins.map((plugin) => [plugin, {}]));
    for (const plugin of plugins) {
      await plugin.handlerWillStart?.({ request, event, state: states.get(plugin) });
    }
    return states;
  }

  async function finishHandling(
    states: Map<(typeof plugins)[number], Record<string, unknown>>,
    response: Response,
  ): Promise<boolean> {
    let current: Response | null = response;
    for (const plugin of plugins) {
      if (!current || !plugin.cacheWillUpdate) {
        continue;
      }
      const next = (await plugin.cacheWillUpdate({
        request,
        response: current,
        event,
        state: states.get(plugin),
      })) as Response | null | undefined;
      current = next ?? null;
    }
    return current !== null;
  }

  async function accepted(response: Response): Promise<boolean> {
    return finishHandling(await startHandling(), response);
  }

  function html(status = 200): Response {
    return new Response("<html></html>", {
      status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  it("accepts a rendered page", async () => {
    expect(await accepted(html())).toBe(true);
  });

  it("refuses a page that ended in a redirect (signed out, no household)", async () => {
    const redirected = html();
    Object.defineProperty(redirected, "redirected", { value: true });
    expect(await accepted(redirected)).toBe(false);
  });

  it("refuses a page whose fetch started before the copies were cleared (the person who left)", async () => {
    const startedBeforeClear = await startHandling();
    discardCopiesInFlight();
    expect(await finishHandling(startedBeforeClear, html())).toBe(false);
    expect(await accepted(html())).toBe(true);
  });

  it("stamps a copy it serves offline, so the page knows it is one", async () => {
    const stamp = plugins.find(
      (plugin) => plugin.cachedResponseWillBeUsed && !(plugin instanceof ExpirationPlugin),
    );
    const served = (await stamp?.cachedResponseWillBeUsed?.({
      cacheName: OFFLINE_COPIES_CACHE,
      request,
      cachedResponse: new Response("<!DOCTYPE html><html><head><title>Casa</title></head></html>", {
        headers: { "content-type": "text/html", "content-length": "60" },
      }),
      event,
      state: {},
    })) as Response | null | undefined;

    expect(await served?.text()).toBe(
      '<!DOCTYPE html><html><head><meta name="feudo-offline-copy" content="1"><title>Casa</title></head></html>',
    );
    expect(served?.headers.get("content-length")).toBeNull();
    expect(served?.headers.get("content-type")).toBe("text/html");
  });

  it("refuses errors and non-HTML responses", async () => {
    expect(await accepted(html(500))).toBe(false);
    expect(await accepted(html(404))).toBe(false);
    expect(
      await accepted(
        new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
      ),
    ).toBe(false);
  });
});
