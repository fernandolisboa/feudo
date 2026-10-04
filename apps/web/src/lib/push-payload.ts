// What the server sends and the service worker shows (ADR-0012). Parsed by
// hand, not with zod, to keep the service worker small.
export type PushPayload = { title: string; body: string; url: string; tag: string };

function isShortText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

const PROBE_ORIGIN = "https://feudo.invalid";

// Only a path inside Feudo. Resolved the way the browser will, since "//host",
// "/\\host" and "/<tab>/host" all leave the origin while starting with "/".
export function isInAppPath(value: unknown): value is string {
  return (
    isShortText(value, 200) &&
    value.startsWith("/") &&
    new URL(value, PROBE_ORIGIN).origin === PROBE_ORIGIN
  );
}

export function parsePushPayload(value: unknown): PushPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const { title, body, url, tag } = value as Record<string, unknown>;
  if (
    !isShortText(title, 120) ||
    !isShortText(body, 400) ||
    !isInAppPath(url) ||
    !isShortText(tag, 120)
  ) {
    return null;
  }
  return { title, body, url, tag };
}

// The sign-out call the browser makes and the notifications slice answers
// (ADR-0012); both sides take the path and the body from here.
export const FORGET_PUSH_DEVICE_PATH = "/api/push-subscription";

export function forgetPushDeviceBody(endpoint: string): { endpoint: string } {
  return { endpoint };
}
