import type { RuntimeCaching, SerwistOptions, SerwistPlugin } from "serwist";
import { CacheExpiration, CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly } from "serwist";

import {
  deleteCachesHoldingCopies,
  isOfflineCopyScreen,
  OFFLINE_COPIES_CACHE,
  OFFLINE_COPY_MAX_AGE_SECONDS,
  OFFLINE_COPY_MAX_ENTRIES,
  OFFLINE_FALLBACK_ROUTE,
  STATIC_ASSETS_CACHE,
} from "./offline-copies";

const STATIC_ASSET_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function isRscRequest(request: Request): boolean {
  return request.headers.get("RSC") === "1";
}

// A copy is only ever the page the server rendered for that screen: a
// redirect (signed out, no household, terms to accept, deletion pending), an
// error or anything other than HTML is never stored under the screen's URL.
const onlyRenderedScreens: SerwistPlugin = {
  cacheWillUpdate: ({ response }) => {
    const isHtml = response.headers.get("content-type")?.startsWith("text/html") === true;
    return Promise.resolve(
      response.status === 200 && !response.redirected && isHtml ? response : null,
    );
  },
};

// Each clear starts a new generation. A page fetch that began before the
// latest clear was made with the cookies of whoever just left, so it is not
// stored even if it completes after the clear.
let copiesGeneration = 0;

const refuseCopiesStartedBeforeAClear: SerwistPlugin = {
  handlerWillStart: ({ state }) => {
    if (state) {
      state.generation = copiesGeneration;
    }
    return Promise.resolve();
  },
  cacheWillUpdate: ({ response, state }) =>
    Promise.resolve(state?.generation === copiesGeneration ? response : null),
};

const copiesExpirationConfig = {
  maxEntries: OFFLINE_COPY_MAX_ENTRIES,
  maxAgeSeconds: OFFLINE_COPY_MAX_AGE_SECONDS,
};

export function discardCopiesInFlight(): void {
  copiesGeneration += 1;
}

export async function clearCopiesInServiceWorker(): Promise<void> {
  discardCopiesInFlight();
  await deleteCachesHoldingCopies();
  // The expiration metadata keeps each copy's full URL, search terms included.
  await new CacheExpiration(OFFLINE_COPIES_CACHE, copiesExpirationConfig).delete();
}

// Expiry otherwise runs only when the copies cache is read or written, so a
// copy past 24 hours would stay stored until then.
export function expireOldCopies(): Promise<void> {
  return new CacheExpiration(OFFLINE_COPIES_CACHE, copiesExpirationConfig).expireEntries();
}

// Order matters: the first matching rule answers. Anything no rule matches
// (cross-origin requests, server actions, other methods) goes to the network
// untouched.
export const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request }) => isRscRequest(request),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: STATIC_ASSETS_CACHE,
      plugins: [
        new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: STATIC_ASSET_MAX_AGE_SECONDS }),
      ],
    }),
  },
  {
    matcher: ({ url, sameOrigin }) => sameOrigin && isOfflineCopyScreen(url.pathname),
    handler: new NetworkFirst({
      cacheName: OFFLINE_COPIES_CACHE,
      // Next varies its pages on router headers a navigation never sends;
      // the key is the screen's URL alone.
      matchOptions: { ignoreVary: true },
      plugins: [
        refuseCopiesStartedBeforeAClear,
        onlyRenderedScreens,
        new ExpirationPlugin(copiesExpirationConfig),
      ],
    }),
  },
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkOnly(),
  },
];

export const offlineFallbacks: NonNullable<SerwistOptions["fallbacks"]> = {
  entries: [
    {
      url: OFFLINE_FALLBACK_ROUTE,
      matcher: ({ request }) => request.mode === "navigate",
    },
  ],
};
