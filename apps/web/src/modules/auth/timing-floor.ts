const TIMING_FLOOR_MS = 500;

// A known email does real work (mint a token, send an email); an unknown one
// takes a fast dummy-lookup branch. Better Auth's own enumeration protection
// only equalizes the response body and status, not the time each branch
// takes, so a caller timing the response could still tell them apart.
const TIMING_FLOOR_PATHS: ReadonlySet<string> = new Set([
  "/request-password-reset",
  "/sign-in/magic-link",
]);

// Keyed by the request's AuthContext instance, which Better Auth's dispatch
// pipeline (dispatch.mjs) keeps stable across a single request's `before`
// and `after` hooks — a WeakMap avoids mutating that typed object to smuggle
// a start time through the pipeline, and lets the entry get garbage
// collected once the request finishes.
const requestStartedAt = new WeakMap<object, number>();

export function markTimingFloorRequestStart(path: string, requestContext: object): void {
  if (TIMING_FLOOR_PATHS.has(path)) {
    requestStartedAt.set(requestContext, Date.now());
  }
}

export async function waitForTimingFloor(path: string, requestContext: object): Promise<void> {
  if (!TIMING_FLOOR_PATHS.has(path)) {
    return;
  }

  const startedAt = requestStartedAt.get(requestContext);
  if (startedAt === undefined) {
    return;
  }
  requestStartedAt.delete(requestContext);

  const remaining = TIMING_FLOOR_MS - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}
