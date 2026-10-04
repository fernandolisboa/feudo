import { z } from "zod";

// The push services browsers subscribe through (ADR-0012): Google for Chrome,
// Edge on Android and Samsung Internet, Microsoft for Edge on Windows, Apple
// for Safari, Mozilla for Firefox. Feudo posts to a stored endpoint, so an
// address outside these hosts would let a client make the server call
// anywhere it likes.
const PUSH_SERVICE_HOSTS = ["fcm.googleapis.com", "web.push.apple.com"];
const PUSH_SERVICE_HOST_SUFFIXES = [
  ".notify.windows.com",
  ".push.apple.com",
  ".push.services.mozilla.com",
];

export function pushServiceHost(endpoint: string): string | null {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.port !== "" || url.username !== "" || url.password !== "") {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const known =
    PUSH_SERVICE_HOSTS.includes(host) ||
    PUSH_SERVICE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  return known ? host : null;
}

const base64Url = z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/);

export const pushSubscriptionInputSchema = z.object({
  endpoint: z
    .string()
    .max(2048)
    .refine((endpoint) => pushServiceHost(endpoint) !== null),
  keys: z.object({
    // A P-256 public key (65 bytes) and a 16-byte secret, base64url-encoded.
    p256dh: base64Url.min(80).max(100),
    auth: base64Url.min(16).max(32),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

export const pushEndpointSchema = pushSubscriptionInputSchema.shape.endpoint;
