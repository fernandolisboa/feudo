import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

import { deleteForeignCaches } from "@/platform/pwa/offline-copies";
import { offlineFallbacks, runtimeCaching } from "@/platform/pwa/runtime-caching";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: offlineFallbacks,
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteForeignCaches());
});

serwist.addEventListeners();
