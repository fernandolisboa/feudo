import { readPushPublicKey } from "./service";

export type PushNotificationsSectionProps = { publicKey: string; userId: string };

// null when push is off: Preferências leaves the section out (ADR-0012).
export function getPushNotificationsSectionProps(session: {
  userId: string;
}): PushNotificationsSectionProps | null {
  const publicKey = readPushPublicKey();
  return publicKey === null ? null : { publicKey, userId: session.userId };
}
