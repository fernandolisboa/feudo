import { waitUntil } from "@vercel/functions";

// @vercel/functions' own waitUntil is already no-op-safe outside a Vercel
// request context (getContext() returns {} and `.waitUntil?.()` short-
// circuits) — the task keeps running either way, since a promise starts
// executing the moment it is created, not when something waits on it. The
// try/catch below is defense in depth against a future waitUntil that
// throws (e.g. a non-Promise argument), not a path its current
// implementation takes.
export function scheduleBackgroundTask(task: Promise<unknown>): void {
  try {
    waitUntil(task);
  } catch {
    task.catch(() => {});
  }
}
