import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BANK_PROFILE_CRITERIA,
  DEFAULT_CANDIDATE_COUNT,
  DEFAULT_MINIMUM_SCORES,
  type WeightLevels,
} from "@feudo/core";

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
import {
  resetCriteriaWeightsAction,
  resolveCriterionOverrideAction,
  saveCriterionOverrideAction,
  updateComparisonSettingsAction,
} from "./actions";
import { getBankDetailPageProps } from "./bank-detail-props";
import { bankCriterionOverride } from "./schema";
import { BANK_PROFILES } from "./bank-profiles";
import { getBanksPageProps } from "./page-props";
import { t } from "./strings";
import { minimumScoreFieldName } from "./validation";

const NOW = new Date("2026-10-02T12:00:00.000Z");

const ONLY_CARDS: WeightLevels = {
  cardBenefits: 5,
  investmentAccess: 0,
  appQuality: 0,
  security: 0,
  fees: 0,
  lockIn: 0,
  publicReviews: 0,
  jointBanking: 0,
};

function settingsForm(
  levels: WeightLevels,
  overrides: { candidateCount?: number; proConMinDifference?: number } = {},
): FormData {
  const formData = new FormData();
  for (const criterion of BANK_PROFILE_CRITERIA) {
    formData.set(criterion, String(levels[criterion]));
    formData.set(minimumScoreFieldName(criterion), String(DEFAULT_MINIMUM_SCORES[criterion]));
  }
  formData.set("candidateCount", String(overrides.candidateCount ?? 3));
  formData.set("proConMinDifference", String(overrides.proConMinDifference ?? 10));
  return formData;
}

function overrideForm(fields: {
  institutionId: string;
  criterion: string;
  score: string;
}): FormData {
  const formData = new FormData();
  formData.set("institutionId", fields.institutionId);
  formData.set("criterion", fields.criterion);
  formData.set("score", fields.score);
  formData.set("note", "Conferido no site do banco.");
  formData.set("sourceUrl", "");
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
      expect(props.weights.find((entry) => entry.criterion === "jointBanking")?.levelLabel).toBe(
        "Essencial",
      );
      expect(props.hasAccounts).toBe(false);
      expect(props.baselineNotice).toBe(t.current.noAccounts);
      expect(props.currentRows).toEqual([]);
      expect(props.candidates).toHaveLength(DEFAULT_CANDIDATE_COUNT);
      expect(props.candidates.every((candidate) => candidate.review.label.length > 0)).toBe(true);
      expect(props.reviewed.map((row) => row.institutionId)).toEqual(
        expect.arrayContaining(["bradesco", "itau"]),
      );
      expect(props.reviewed).toHaveLength(BANK_PROFILES.length);
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
      expect(props.reviewed.find((row) => row.institutionId === "nubank")?.tag).toBe(
        t.reviewed.current,
      );
      expect(props.candidates.map((candidate) => candidate.institutionId)).not.toContain("nubank");
      expect(props.baselineNotice).toBeNull();
      expect(props.unrecognizedNotice).toContain("MeuPluggy");
    });
  });

  it("saves an owner's settings for their own household only and ranks with them", async () => {
    await withTwoUsers(async ({ userA, userB }) => {
      signInAs(userA.session);

      const result = await updateComparisonSettingsAction(
        initialActionState,
        settingsForm(ONLY_CARDS),
      );

      expect(result).toEqual({ status: "success", message: t.saved });
      const propsA = await getBanksPageProps(userA.session, NOW);
      expect(propsA.weightsAreCustom).toBe(true);
      expect(propsA.weights.find((entry) => entry.criterion === "cardBenefits")?.level).toBe(5);
      expect(propsA.candidates.every((candidate) => candidate.scoreLabel === "80")).toBe(true);
      const propsB = await getBanksPageProps(userB.session, NOW);
      expect(propsB.weightsAreCustom).toBe(false);
    });
  });

  it("refuses a set where nothing counts and keeps what was stored", async () => {
    await withTwoUsers(async ({ userA }) => {
      signInAs(userA.session);
      await updateComparisonSettingsAction(initialActionState, settingsForm(ONLY_CARDS));

      const result = await updateComparisonSettingsAction(
        initialActionState,
        settingsForm({ ...ONLY_CARDS, cardBenefits: 0 }),
      );

      expect(result).toEqual({ status: "error", message: t.errors.allZero });
      const props = await getBanksPageProps(userA.session, NOW);
      expect(props.weights.find((entry) => entry.criterion === "cardBenefits")?.level).toBe(5);
    });
  });

  it("refuses a member who is not owner or admin, without writing", async () => {
    await withTwoUsers(async ({ db, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA, "member");
      const memberSession = { ...userB.session, householdId: householdA };
      signInAs(memberSession);

      const result = await updateComparisonSettingsAction(
        initialActionState,
        settingsForm(ONLY_CARDS),
      );
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
      await updateComparisonSettingsAction(initialActionState, settingsForm(ONLY_CARDS));

      const result = await resetCriteriaWeightsAction();

      expect(result).toEqual({ status: "success", message: t.resetDone });
      const props = await getBanksPageProps(userA.session, NOW);
      expect(props.weightsAreCustom).toBe(false);
    });
  });

  it("gates candidates on a required criterion's minimum score", async () => {
    await withTwoUsers(async ({ userA }) => {
      signInAs(userA.session);
      const formData = settingsForm({ ...ONLY_CARDS, jointBanking: "required" });
      formData.set(minimumScoreFieldName("jointBanking"), "100");

      await updateComparisonSettingsAction(initialActionState, formData);
      const props = await getBanksPageProps(userA.session, NOW);

      for (const candidate of props.candidates) {
        expect(
          props.reviewed.find((row) => row.institutionId === candidate.institutionId)?.unmetLabel,
        ).toBeNull();
      }
    });
  });

  it("keeps an owner's correction to their own household and scores with it", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      signInAs(userA.session);

      const result = await saveCriterionOverrideAction(
        initialActionState,
        overrideForm({ institutionId: "nubank", criterion: "jointBanking", score: "0" }),
      );

      expect(result).toEqual({ status: "success", message: t.override.saved });
      const detailA = await getBankDetailPageProps(userA.session, "nubank", NOW);
      const jointA = detailA?.criteria.find((item) => item.criterion === "jointBanking");
      expect(jointA?.scoreLabel).toBe("0");
      expect(jointA?.referenceScoreLabel).toBe("65");
      expect(jointA?.override?.outdatedHint).toBeNull();
      const detailB = await getBankDetailPageProps(userB.session, "nubank", NOW);
      expect(
        detailB?.criteria.find((item) => item.criterion === "jointBanking")?.override,
      ).toBeNull();
      expect(detailA?.stats[0]?.value).not.toBe(detailB?.stats[0]?.value);

      const [row] = await db.select().from(bankCriterionOverride);
      const reference = BANK_PROFILES.find((profile) => profile.institutionId === "nubank");
      expect(row?.baseReviewedAt).toBe(reference?.criteria.jointBanking.reviewedAt);
    });
  });

  it("offers a newer reference review and either drops or keeps the household's correction", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      signInAs(userA.session);
      await saveCriterionOverrideAction(
        initialActionState,
        overrideForm({ institutionId: "nubank", criterion: "fees", score: "50" }),
      );
      await saveCriterionOverrideAction(
        initialActionState,
        overrideForm({ institutionId: "nubank", criterion: "lockIn", score: "20" }),
      );
      await db.update(bankCriterionOverride).set({ baseReviewedAt: "2026-01-01" });

      const before = await getBankDetailPageProps(userA.session, "nubank", NOW);
      const fees = before?.criteria.find((item) => item.criterion === "fees");
      expect(fees?.override?.outdatedHint).toContain("Tarifas");
      expect((await getBanksPageProps(userA.session, NOW)).overridesNotice).toContain("Nubank");

      expect(await resolveCriterionOverrideAction("nubank", "fees", "useReference")).toEqual({
        status: "success",
        message: t.override.removed,
      });
      expect(await resolveCriterionOverrideAction("nubank", "lockIn", "keepOwn")).toEqual({
        status: "success",
        message: t.override.kept,
      });

      const after = await getBankDetailPageProps(userA.session, "nubank", NOW);
      expect(after?.criteria.find((item) => item.criterion === "fees")?.override).toBeNull();
      const lockIn = after?.criteria.find((item) => item.criterion === "lockIn");
      expect(lockIn?.scoreLabel).toBe("20");
      expect(lockIn?.override?.outdatedHint).toBeNull();
      expect((await getBanksPageProps(userA.session, NOW)).overridesNotice).toBeNull();
    });
  });

  it("refuses a member's correction and a member's answer to the hint, without writing", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      signInAs(userA.session);
      await saveCriterionOverrideAction(
        initialActionState,
        overrideForm({ institutionId: "itau", criterion: "fees", score: "10" }),
      );
      await joinHousehold(db, userB.id, householdA, "member");
      const memberSession = { ...userB.session, householdId: householdA };
      signInAs(memberSession);

      expect(
        await saveCriterionOverrideAction(
          initialActionState,
          overrideForm({ institutionId: "itau", criterion: "fees", score: "99" }),
        ),
      ).toEqual({ status: "error", message: t.errors.notAllowed });
      expect(await resolveCriterionOverrideAction("itau", "fees", "useReference")).toEqual({
        status: "error",
        message: t.errors.notAllowed,
      });

      const rows = await db.select().from(bankCriterionOverride);
      expect(rows.map((row) => row.score)).toEqual([10]);
      const detail = await getBankDetailPageProps(memberSession, "itau", NOW);
      expect(detail?.canManage).toBe(false);
      expect(detail?.criteria.find((item) => item.criterion === "fees")?.scoreLabel).toBe("10");
    });
  });

  it("never touches another household's correction when answering the hint", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      signInAs(userB.session);
      await saveCriterionOverrideAction(
        initialActionState,
        overrideForm({ institutionId: "c6", criterion: "fees", score: "10" }),
      );
      signInAs(userA.session);

      await resolveCriterionOverrideAction("c6", "fees", "useReference");

      expect(await db.select().from(bankCriterionOverride)).toHaveLength(1);
    });
  });

  it("has no page for an institution Feudo does not profile", async () => {
    await withTwoUsers(async ({ userA }) => {
      expect(await getBankDetailPageProps(userA.session, "banco-inexistente", NOW)).toBeNull();
    });
  });
});
