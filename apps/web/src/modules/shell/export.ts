import { eq } from "drizzle-orm";

import type { CurrentSession } from "@/modules/auth";
import { user } from "@/modules/auth/schema";

import { getDb } from "@/platform/db/client";
import { userTour } from "./schema";

// The LGPD export's own reader (#25): the session user's own tutorial
// state, the same two reads readTourState already does (toursAutoStart off
// the user row it owns no table for, and this slice's own user_tour rows),
// scoped to the one user the export is for.
export async function getTourExportData(session: CurrentSession) {
  const db = getDb();
  const [preferenceRows, tours] = await Promise.all([
    db
      .select({ toursAutoStart: user.toursAutoStart })
      .from(user)
      .where(eq(user.id, session.userId)),
    db
      .select({
        tourId: userTour.tourId,
        tourVersion: userTour.tourVersion,
        outcome: userTour.outcome,
        updatedAt: userTour.updatedAt,
      })
      .from(userTour)
      .where(eq(userTour.userId, session.userId)),
  ]);

  return { toursAutoStart: preferenceRows[0]?.toursAutoStart ?? true, tours };
}

export type TourExportData = Awaited<ReturnType<typeof getTourExportData>>;
