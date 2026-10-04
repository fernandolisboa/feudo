import type { CurrentSession } from "@/modules/auth";

export type PushUserScope = { userId: string };

// Push subscriptions are user-scoped (ADR-0001, ADR-0012). Like
// sync.userScope, this takes the whole session so a scope can only come from
// a real session read, never from an id passed loose.
export function pushUserScope(session: CurrentSession): PushUserScope {
  return { userId: session.userId };
}

// Module-private: this module's own tests, which seed users directly.
export function scopeForUser(userId: string): PushUserScope {
  return { userId };
}
