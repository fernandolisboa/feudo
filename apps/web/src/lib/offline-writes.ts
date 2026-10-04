export const WRITE_BLOCKED_EVENT = "feudo:write-blocked";

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
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
