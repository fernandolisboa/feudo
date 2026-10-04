import { and, desc, eq, isNull, notInArray, sql } from "drizzle-orm";

import { member, organization, user } from "@/modules/auth/schema";
import { householdIsNotPendingDeletion, type HouseholdScope } from "@/modules/households";

import type { DatabaseOrTransaction } from "@/platform/db/client";
import { pushSubscription } from "./schema";
import type { PushUserScope } from "./scope";
import type { PushSubscriptionInput } from "./validation";

export const MAX_DEVICES_PER_USER = 10;

export type StoredPushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const storedColumns = {
  id: pushSubscription.id,
  endpoint: pushSubscription.endpoint,
  p256dh: pushSubscription.p256dh,
  auth: pushSubscription.auth,
};

// Every method works on the user closed over at construction time, taken
// from the session (ADR-0001); none accepts a user id.
export function createPushSubscriptionRepository(scope: PushUserScope) {
  return {
    // The endpoint identifies one device, and the device belongs to whoever
    // turned notifications on there last (ADR-0012): saving an endpoint
    // another user held moves it. The endpoint is an unguessable address only
    // the browser that owns it can hand over. Past MAX_DEVICES_PER_USER, the
    // oldest of this user's devices goes.
    async save(db: DatabaseOrTransaction, input: PushSubscriptionInput): Promise<void> {
      await db.transaction(async (tx) => {
        await tx
          .insert(pushSubscription)
          .values({
            userId: scope.userId,
            endpoint: input.endpoint,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
          })
          .onConflictDoUpdate({
            target: pushSubscription.endpoint,
            set: {
              userId: scope.userId,
              p256dh: input.keys.p256dh,
              auth: input.keys.auth,
              // "Since when" for the export and the device cap: a re-save by
              // the same person keeps it, a move to someone else restarts it.
              createdAt: sql`case when ${pushSubscription.userId} = ${scope.userId} then ${pushSubscription.createdAt} else now() end`,
            },
          });
        const kept = tx
          .select({ id: pushSubscription.id })
          .from(pushSubscription)
          .where(eq(pushSubscription.userId, scope.userId))
          .orderBy(desc(pushSubscription.createdAt), desc(pushSubscription.id))
          .limit(MAX_DEVICES_PER_USER);
        await tx
          .delete(pushSubscription)
          .where(
            and(eq(pushSubscription.userId, scope.userId), notInArray(pushSubscription.id, kept)),
          );
      });
    },

    async remove(db: DatabaseOrTransaction, endpoint: string): Promise<boolean> {
      const removed = await db
        .delete(pushSubscription)
        .where(
          and(eq(pushSubscription.userId, scope.userId), eq(pushSubscription.endpoint, endpoint)),
        )
        .returning({ id: pushSubscription.id });
      return removed.length > 0;
    },

    async removeAll(db: DatabaseOrTransaction): Promise<void> {
      await db.delete(pushSubscription).where(eq(pushSubscription.userId, scope.userId));
    },

    async list(db: DatabaseOrTransaction): Promise<Array<{ endpoint: string; createdAt: Date }>> {
      return db
        .select({ endpoint: pushSubscription.endpoint, createdAt: pushSubscription.createdAt })
        .from(pushSubscription)
        .where(eq(pushSubscription.userId, scope.userId))
        .orderBy(desc(pushSubscription.createdAt));
    },
  };
}

export type HouseholdRecipients = {
  householdName: string;
  subscriptions: StoredPushSubscription[];
};

// Not session-scoped: the jobs that notify (month close, monthly analysis)
// have no session and work one household at a time (ADR-0012). Only current
// members are read, and nobody whose account deletion is pending; a household
// pending deletion has no recipients at all.
export async function listHouseholdRecipients(
  db: DatabaseOrTransaction,
  scope: HouseholdScope,
): Promise<HouseholdRecipients | null> {
  const rows = await db
    .select({ householdName: organization.name, ...storedColumns })
    .from(pushSubscription)
    .innerJoin(user, eq(user.id, pushSubscription.userId))
    .innerJoin(member, eq(member.userId, pushSubscription.userId))
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(
      and(
        eq(member.organizationId, scope.householdId),
        isNull(user.deletionRequestedAt),
        householdIsNotPendingDeletion(),
      ),
    );
  const [first] = rows;
  if (!first) {
    return null;
  }
  return {
    householdName: first.householdName,
    subscriptions: rows.map(({ id, endpoint, p256dh, auth }) => ({ id, endpoint, p256dh, auth })),
  };
}

// Not session-scoped: the sync job notifies a connection's owner by the id
// on the connection it just ran (ADR-0012).
export async function listUserRecipients(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<StoredPushSubscription[]> {
  return db
    .select(storedColumns)
    .from(pushSubscription)
    .innerJoin(user, eq(user.id, pushSubscription.userId))
    .where(and(eq(pushSubscription.userId, userId), isNull(user.deletionRequestedAt)));
}

// The push service said this endpoint no longer exists (404/410). The row
// comes from a recipients read in the same send; matching its keys too leaves
// alone a row that was saved again with fresh keys in the meantime.
export async function deleteGoneSubscription(
  db: DatabaseOrTransaction,
  subscription: StoredPushSubscription,
): Promise<void> {
  await db
    .delete(pushSubscription)
    .where(
      and(
        eq(pushSubscription.id, subscription.id),
        eq(pushSubscription.p256dh, subscription.p256dh),
        eq(pushSubscription.auth, subscription.auth),
      ),
    );
}
