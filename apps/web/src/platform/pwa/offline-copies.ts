// The one Cache Storage cache that holds financial data (ADR-0007): the last
// copy of each signed-in screen, kept so the installed app can show it
// without network. Every other cache the service worker keeps holds only
// build assets that are the same for every user.
export const OFFLINE_COPIES_CACHE = "feudo-offline-copies";
export const STATIC_ASSETS_CACHE = "feudo-static-assets";
const PRECACHE_PREFIX = "serwist-precache";

export const OFFLINE_FALLBACK_ROUTE = "/sem-conexao";

// The person and household the copies on this browser belong to.
export const OFFLINE_COPIES_SCOPE_KEY = "feudo.offline-copies.scope";

const CLEAR_OFFLINE_COPIES = "FEUDO_CLEAR_OFFLINE_COPIES";
const SERVICE_WORKER_ACK_TIMEOUT_MS = 2_000;

// The privacy policy promises at most 24 hours on the device.
export const OFFLINE_COPY_MAX_AGE_SECONDS = 24 * 60 * 60;
export const OFFLINE_COPY_MAX_ENTRIES = 32;

const OFFLINE_COPY_SCREENS: ReadonlySet<string> = new Set([
  "/",
  "/transacoes",
  "/reserva",
  "/bancos",
  "/casa",
  "/categorias",
  "/como-usar",
]);

export function isOfflineCopyScreen(pathname: string): boolean {
  return OFFLINE_COPY_SCREENS.has(pathname);
}

function holdsOnlyBuildAssets(cacheName: string): boolean {
  return cacheName.startsWith(PRECACHE_PREFIX) || cacheName === STATIC_ASSETS_CACHE;
}

// Deletes every cache that could hold a signed-in response: the offline
// copies and any cache an earlier service worker left behind (the Serwist
// default cache kept authenticated pages and RSC payloads, #116).
export async function deleteCachesHoldingCopies(): Promise<void> {
  if (typeof caches === "undefined") {
    return;
  }
  const names = await caches.keys();
  await Promise.all(
    names.filter((name) => !holdsOnlyBuildAssets(name)).map((name) => caches.delete(name)),
  );
}

// The service worker also clears, so a page it is still fetching for the
// person leaving is never stored after this resolves (see runtime-caching).
export async function clearOfflineCopies(): Promise<void> {
  forgetScope();
  await Promise.all([askServiceWorkerToClear(), deleteCachesHoldingCopies()]);
}

export function isClearOfflineCopiesMessage(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === CLEAR_OFFLINE_COPIES
  );
}

function forgetScope(): void {
  try {
    window.localStorage.removeItem(OFFLINE_COPIES_SCOPE_KEY);
  } catch {
    // No storage, nothing to forget.
  }
}

function askServiceWorkerToClear(): Promise<void> {
  const worker =
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? navigator.serviceWorker.controller
      : null;
  if (!worker) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(resolve, SERVICE_WORKER_ACK_TIMEOUT_MS);
    channel.port1.onmessage = () => {
      clearTimeout(timeout);
      resolve();
    };
    worker.postMessage({ type: CLEAR_OFFLINE_COPIES }, [channel.port2]);
  });
}

// Run by the service worker on activation: the offline copies survive an
// update, anything else that is not a build asset does not.
export async function deleteForeignCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => !holdsOnlyBuildAssets(name) && name !== OFFLINE_COPIES_CACHE)
      .map((name) => caches.delete(name)),
  );
}

// An in-app navigation brings the screen as an RSC payload, which is never
// stored; the service worker fetches the screen's page itself so the copy
// matches what was just shown. Serwist handles the CACHE_URLS message through
// the same runtime caching rules as any other request.
export function requestOfflineCopy(href: string): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }
  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: "CACHE_URLS", payload: { urlsToCache: [href] } });
  });
}
