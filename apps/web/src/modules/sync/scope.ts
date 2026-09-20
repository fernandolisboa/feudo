import type { CurrentSession } from "@/modules/auth";

export type UserScope = { userId: string };

// Bank connections and provider credentials are user-scoped (ADR-0001). Like
// households.householdScope, this takes the whole session so a scope can
// only ever come from a real session read, never from an id passed loose.
export function userScope(session: CurrentSession): UserScope {
  return { userId: session.userId };
}

// Module-private: only this module's own tests seed users directly.
export function scopeForUser(userId: string): UserScope {
  return { userId };
}
