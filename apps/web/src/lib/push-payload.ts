// What the server sends and the service worker shows (ADR-0012). Parsed by
// hand, not with zod, to keep the service worker small.
export type PushPayload = { title: string; body: string; url: string; tag: string };

function isShortText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

// Only a path inside Feudo: "/x" but never "//host", which a browser reads
// as another origin.
function isInAppPath(value: unknown): value is string {
  return isShortText(value, 200) && value.startsWith("/") && !value.startsWith("//");
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
