import type { ActionState } from "./action-state";

export const WRITE_BLOCKED_EVENT = "feudo:write-blocked";

// The service worker stamps a page it served from the offline copies because
// the network failed. navigator.onLine alone misses that: a computer on a
// network with no internet still reports itself online.
export const OFFLINE_COPY_MARKER = "feudo-offline-copy";

function offlineCopyMarker(): Element | null {
  return typeof document === "undefined"
    ? null
    : document.querySelector(`meta[name="${OFFLINE_COPY_MARKER}"]`);
}

export function isServedOfflineCopy(): boolean {
  return offlineCopyMarker() !== null;
}

// Called when the network is known to be back (the browser's online event, a
// request that reached the server) while the stamped page is still on screen.
export function noteReconnected(): void {
  offlineCopyMarker()?.remove();
}

export function isBrowserOffline(): boolean {
  return (typeof navigator !== "undefined" && !navigator.onLine) || isServedOfflineCopy();
}

// Offline, a write does nothing and says so (ADR-0007): there is no queue to
// replay it later. The app shell listens for the event and shows the message.
export function blockWriteWhenOffline(): boolean {
  if (!isBrowserOffline()) {
    return false;
  }
  window.dispatchEvent(new Event(WRITE_BLOCKED_EVENT));
  return true;
}

// For forms on screens without the app shell (sign-in, terms, onboarding),
// whose submissions the shell's guard never sees: offline, the form shows
// the message in its own alert instead of the request failing.
export function refuseWhenOffline<Args extends unknown[]>(
  action: (...args: Args) => Promise<ActionState>,
  offlineMessage: string,
): (...args: Args) => Promise<ActionState> {
  return (...args) =>
    blockWriteWhenOffline()
      ? Promise.resolve({ status: "error", message: offlineMessage })
      : action(...args);
}
