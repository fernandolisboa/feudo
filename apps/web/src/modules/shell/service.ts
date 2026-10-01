import { getDb } from "@/platform/db/client";
import { getCurrentSession } from "@/modules/auth";

import {
  deleteTourOutcomes,
  readTourState,
  setToursAutoStart,
  upsertTourOutcome,
} from "./repository";
import type { TourState } from "./tour-state";
import { TOURS } from "./tours";
import { recordTourOutcomeSchema, tourAutoStartFormSchema } from "./validation";

export type TourWriteOutcome =
  { status: "ok" } | { status: "unauthenticated" } | { status: "invalid" };

export async function getTourState(session: { userId: string }): Promise<TourState> {
  return readTourState(getDb(), session.userId);
}

export async function recordTourOutcome(input: unknown): Promise<TourWriteOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }

  const parsed = recordTourOutcomeSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid" };
  }

  const { tourId, outcome, turnOffAutoStart } = parsed.data;
  await getDb().transaction(async (tx) => {
    await upsertTourOutcome(tx, session.userId, TOURS[tourId], outcome);
    if (turnOffAutoStart) {
      await setToursAutoStart(tx, session.userId, false);
    }
  });
  return { status: "ok" };
}

export async function updateTourAutoStart(input: unknown): Promise<TourWriteOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }

  const parsed = tourAutoStartFormSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid" };
  }

  await setToursAutoStart(getDb(), session.userId, parsed.data.autoStart);
  return { status: "ok" };
}

export async function resetTours(): Promise<TourWriteOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }

  await deleteTourOutcomes(getDb(), session.userId);
  return { status: "ok" };
}
