import { eq, sql } from "drizzle-orm";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import { user } from "@/modules/auth/schema";

import { userTour } from "./schema";
import type { TourState } from "./tour-state";
import { isTourId, type TourId } from "./tours";

export type TourOutcome = (typeof userTour.$inferSelect)["outcome"];

export async function readTourState(db: Database, userId: string): Promise<TourState> {
  const [preference] = await db
    .select({ autoStart: user.toursAutoStart })
    .from(user)
    .where(eq(user.id, userId));
  const rows = await db
    .select({ tourId: userTour.tourId, tourVersion: userTour.tourVersion })
    .from(userTour)
    .where(eq(userTour.userId, userId));

  const seenVersions: TourState["seenVersions"] = {};
  for (const row of rows) {
    if (isTourId(row.tourId)) {
      seenVersions[row.tourId] = row.tourVersion;
    }
  }
  return { autoStart: preference?.autoStart ?? true, seenVersions };
}

export async function upsertTourOutcome(
  db: DatabaseOrTransaction,
  userId: string,
  tour: { id: TourId; version: number },
  outcome: TourOutcome,
): Promise<void> {
  await db
    .insert(userTour)
    .values({ userId, tourId: tour.id, tourVersion: tour.version, outcome })
    .onConflictDoUpdate({
      target: [userTour.userId, userTour.tourId],
      set: { tourVersion: tour.version, outcome, updatedAt: sql`now()` },
    });
}

export async function setToursAutoStart(
  db: DatabaseOrTransaction,
  userId: string,
  autoStart: boolean,
): Promise<void> {
  await db.update(user).set({ toursAutoStart: autoStart }).where(eq(user.id, userId));
}

export async function deleteTourOutcomes(db: Database, userId: string): Promise<void> {
  await db.delete(userTour).where(eq(userTour.userId, userId));
}
