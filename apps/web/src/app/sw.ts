import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

import { deleteForeignCaches, isClearOfflineCopiesMessage } from "@/platform/pwa/offline-copies";
import {
  clearCopiesInServiceWorker,
  expireOldCopies,
  offlineFallbacks,
  precacheOptions,
  runtimeCaching,
} from "@/platform/pwa/runtime-caching";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: offlineFallbacks,
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteForeignCaches());
});

self.addEventListener("message", (event) => {
  if (!isClearOfflineCopiesMessage(event.data)) {
    return;
  }
  event.waitUntil(
    clearCopiesInServiceWorker().finally(() => {
      event.ports[0]?.postMessage("cleared");
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.waitUntil(expireOldCopies());
  }
});

serwist.addEventListeners();
