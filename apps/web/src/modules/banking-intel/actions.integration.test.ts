import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BANK_PROFILE_CRITERIA, DEFAULT_CRITERIA_WEIGHTS, type CriteriaWeights } from "@feudo/core";

const getCurrentSessionMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/auth")>()),
  getCurrentSession: getCurrentSessionMock,
}));

import { householdScope, type HouseholdSession } from "@/modules/households";
import { bankConnection } from "@/modules/sync/schema";
import { seedSyncedConnection } from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { initialActionState } from "@/lib/action-state";
import type { Database } from "@/platform/db/client";
import { resetCriteriaWeightsAction, updateCriteriaWeightsAction } from "./actions";
import { getBanksPageProps } from "./page-props";
import { t } from "./strings";

const NOW = new Date("2026-10-02T12:00:00.000Z");

const ONLY_CARDS: CriteriaWeights = {
  cardBenefits: 5,
  investmentAccess: 0,
  appQuality: 0,
  security: 0,
  fees: 0,
  lockIn: 0,
  publicReviews: 0,
};

function weightsForm(weights: CriteriaWeights): FormData {
  const formData = new FormData();
  for (const criterion of BANK_PROFILE_CRITERIA) {
    formData.set(criterion, String(weights[criterion]));
  }
  return formData;
}

function signInAs(session: HouseholdSession): void {
  getCurrentSessionMock.mockResolvedValue(session);
}

async function renameConnection(db: Database, connectionId: string, label: string): Promise<void> {
  await db
    .update(bankConnection)
    .set({ institutionName: label })
    .where(eq(bankConnection.id, connectionId));
}

beforeEach(() => {
  getCurrentSessionMock.mockReset();
});

describe("Bancos server boundary (integration)", () => {
  it("compares with the median bank and uses the product defaults for a household with no accounts", async () => {
    await withTwoUsers(async ({ userA }) => {
      const props = await getBanksPageProps(userA.session, NOW);

      expect(props.weightsAreCustom).toBe(false);
      expect(props.weights.map((entry) => entry.weight)).toEqual(
        BANK_PROFILE_CRITERIA.map((criterion) => DEFAULT_CRITERIA_WEIGHTS[criterion]),
      );
      expect(props.hasAccounts).toBe(false);
      expect(props.baselineNotice).toBe(t.current.noAccounts);
      expect(props.currentRows).toEqual([]);
      expect(props.candidates).toHaveLength(3);
      expect(props.candidates.every((candidate) => candidate.review.label.length > 0)).toBe(true);
    });
  });

  it("sets the candidates against the institutions the household's accounts are connected to", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      const nubank = await seedSyncedConnection(db, userA, { household: scope });
      await renameConnection(db, nubank.connectionId, "Nubank");
      const unnamed = await seedSyncedConnection(db, userA, {
        household: scope,
        itemId: "1a2b3c4d-0000-4000-8000-000000000002",
      });
      await renameConnection(db, unnamed.connectionId, "MeuPluggy");

      const props = await getBanksPageProps(userA.session, NOW);

      expect(props.currentRows.map((row) => row.name)).toEqual(["Nubank"]);
      expect(props.candidates.map((candidate) => candidate.institutionId)).not.toContain("nubank");
      expect(props.baselineNotice).toBeNull();
      expect(props.unrecognizedNotice).toContain("MeuPluggy");
    });
  });

  it("saves an owner's weights for their own household only and ranks with them", async () => {
    await withTwoUsers(async ({ userA, userB }) => {
      signInAs(userA.session);

      const result = await updateCriteriaWeightsAction(initialActionState, weightsForm(ONLY_CARDS));

      expect(result).toEqual({ status: "success", message: t.saved });
      const propsA = await getBanksPageProps(userA.session, NOW);
      expect(propsA.weightsAreCustom).toBe(true);
      expect(propsA.weights.map((entry) => entry.weight)).toEqual(
        BANK_PROFILE_CRITERIA.map((criterion) => ONLY_CARDS[criterion]),
      );
      expect(propsA.candidates.every((candidate) => candidate.scoreLabel === "80")).toBe(true);
      const propsB = await getBanksPageProps(userB.session, NOW);
      expect(propsB.weightsAreCustom).toBe(false);
    });
  });

  it("refuses a set where nothing counts and keeps what was stored", async () => {
    await withTwoUsers(async ({ userA }) => {
      signInAs(userA.session);
      await updateCriteriaWeightsAction(initialActionState, weightsForm(ONLY_CARDS));

      const result = await updateCriteriaWeightsAction(
        initialActionState,
        weightsForm({ ...ONLY_CARDS, cardBenefits: 0 }),
      );

      expect(result).toEqual({ status: "error", message: t.errors.allZero });
      const props = await getBanksPageProps(userA.session, NOW);
      expect(props.weights.find((entry) => entry.criterion === "cardBenefits")?.weight).toBe(5);
    });
  });

  it("refuses a member who is not owner or admin, without writing", async () => {
    await withTwoUsers(async ({ db, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA, "member");
      const memberSession = { ...userB.session, householdId: householdA };
      signInAs(memberSession);

      const result = await updateCriteriaWeightsAction(initialActionState, weightsForm(ONLY_CARDS));
      const reset = await resetCriteriaWeightsAction();

      expect(result).toEqual({ status: "error", message: t.errors.notAllowed });
      expect(reset).toEqual({ status: "error", message: t.errors.notAllowed });
      const props = await getBanksPageProps(memberSession, NOW);
      expect(props.canManage).toBe(false);
      expect(props.weightsAreCustom).toBe(false);
    });
  });

  it("puts the product defaults back on reset", async () => {
    await withTwoUsers(async ({ userA }) => {
      signInAs(userA.session);
      await updateCriteriaWeightsAction(initialActionState, weightsForm(ONLY_CARDS));

      const result = await resetCriteriaWeightsAction();

      expect(result).toEqual({ status: "success", message: t.resetDone });
      const props = await getBanksPageProps(userA.session, NOW);
      expect(props.weightsAreCustom).toBe(false);
    });
  });
});
