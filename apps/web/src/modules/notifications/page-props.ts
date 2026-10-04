import { readPushPublicKey } from "./service";

export type PushNotificationsSectionProps = { publicKey: string };

// null when push is off: Preferências leaves the section out (ADR-0012).
export function getPushNotificationsSectionProps(): PushNotificationsSectionProps | null {
  const publicKey = readPushPublicKey();
  return publicKey === null ? null : { publicKey };
}
