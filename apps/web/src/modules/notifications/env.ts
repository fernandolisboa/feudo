import { z } from "zod";

import type { VapidKeys } from "./web-push-sender";

export interface PushEnv {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  [key: string]: string | undefined;
}

// Who push services contact about this sender (RFC 8292): the same address
// the privacy policy gives for data requests.
const DEFAULT_VAPID_SUBJECT = "mailto:feudo@miolos.app";

export class InvalidVapidConfigError extends Error {
  constructor(detail: string) {
    super(`The VAPID configuration is invalid: ${detail}`);
    this.name = "InvalidVapidConfigError";
  }
}

// A P-256 public key is 65 bytes and a private key 32, base64url-encoded.
const vapidSchema = z.object({
  publicKey: z.string().regex(/^[A-Za-z0-9_-]{87}$/),
  privateKey: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  subject: z.string().regex(/^(mailto:|https:\/\/)\S+$/),
});

function readOptional(env: PushEnv, key: string): string | undefined {
  const raw = env[key];
  return raw === undefined || raw.trim() === "" ? undefined : raw.trim();
}

// Push is optional to the product (ADR-0012): with neither key set it is
// simply off. Half a configuration is a mistake worth failing loudly on.
export function readVapidKeys(env: PushEnv = process.env): VapidKeys | null {
  const publicKey = readOptional(env, "VAPID_PUBLIC_KEY");
  const privateKey = readOptional(env, "VAPID_PRIVATE_KEY");
  if (publicKey === undefined && privateKey === undefined) {
    return null;
  }
  const parsed = vapidSchema.safeParse({
    publicKey,
    privateKey,
    subject: readOptional(env, "VAPID_SUBJECT") ?? DEFAULT_VAPID_SUBJECT,
  });
  if (!parsed.success) {
    throw new InvalidVapidConfigError(
      parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
    );
  }
  return parsed.data;
}
