import type { ActionState } from "./action-state";

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
