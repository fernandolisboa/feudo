import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { organization, user } from "@/modules/auth/schema";
import { householdScope } from "@/modules/households";
import { getGuidedCategorizationProps } from "@/modules/ledger";
import { bankTransaction } from "@/modules/sync/schema";
import {
  moveSeededAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type SeededUser } from "@/modules/sync/test/with-two-users";

import type { Database } from "@/platform/db/client";
import type { AiClient } from "./ai-client";
import {
  CATEGORY_SUGGESTION_RUNS_PER_DAY,
  readAiCategorySuggestions,
  requestCategorySuggestions,
} from "./category-suggestions";
import { createCategorySuggestionsRepository } from "./category-suggestions-repository";
import { createFakeAiClient } from "./fake-client";
import { CURRENT_CATEGORY_SUGGESTER_PROMPT } from "./prompts";
import type { AiProvider } from "./provider";
import { runDailyPruneStep } from "./prune";
import { categoryAiSuggestion, categorySuggestionRun } from "./schema";

const PROMPT_VERSION = CURRENT_CATEGORY_SUGGESTER_PROMPT.version;

async function transactionIdFor(db: Database, providerTransactionId: string): Promise<string> {
  const [row] = await db
    .select({ id: bankTransaction.id })
    .from(bankTransaction)
    .where(eq(bankTransaction.providerTransactionId, providerTransactionId));
  if (!row) {
    throw new Error(`seed did not create transaction ${providerTransactionId}`);
  }
  return row.id;
}

function providerFor(client: AiClient): AiProvider {
  return { verifyKey: () => Promise.resolve({ status: "ok" }), clientFor: () => client };
}

function deps() {
  return {
    provider: providerFor(createFakeAiClient()),
    encryptionKey: null,
    prompt: CURRENT_CATEGORY_SUGGESTER_PROMPT,
  };
}

const NOW = new Date("2026-11-10T12:00:00.000Z");

function options(now: Date = NOW) {
  return { now, deadline: new Date(Date.now() + 5 * 60_000) };
}

async function seedPendingTransaction(
  db: Database,
  owner: SeededUser,
  household: { householdId: string },
  providerTransactionId: string,
  description: string,
): Promise<string> {
  await seedSyncedConnection(db, owner, {
    household,
    itemId: crypto.randomUUID(),
    transactions: [
      seedTransaction({
        providerTransactionId,
        description,
        date: "2026-10-15",
        amountCentavos: -2_000,
      }),
    ],
  });
  return transactionIdFor(db, providerTransactionId);
}

describe("category_ai_suggestion isolation (integration)", () => {
  it("never lets household B read a suggestion a press stored for household A's transaction", async () => {
    await withTwoUsers(async ({ db, userA, householdA, householdB }) => {
      await seedPendingTransaction(
        db,
        userA,
        householdScope(userA.session),
        "a1",
        "Padaria Estrela A",
      );

      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      const repositoryA = createCategorySuggestionsRepository({ householdId: householdA });
      const repositoryB = createCategorySuggestionsRepository({ householdId: householdB });
      expect((await repositoryA.readSuggestions(db, PROMPT_VERSION)).size).toBe(1);
      expect((await repositoryB.readSuggestions(db, PROMPT_VERSION)).size).toBe(0);
    });
  });

  it("writes no row when household B's save path targets household A's transaction", async () => {
    await withTwoUsers(async ({ db, userA, householdB }) => {
      const transactionId = await seedPendingTransaction(
        db,
        userA,
        householdScope(userA.session),
        "a2",
        "Padaria Estrela A",
      );
      const repositoryB = createCategorySuggestionsRepository({ householdId: householdB });

      await repositoryB.saveSuggestions(db, {
        promptVersion: PROMPT_VERSION,
        model: "fake-model",
        answers: [{ transactionId, subcategoryId: "shopping.other" }],
      });

      const rows = await db
        .select()
        .from(categoryAiSuggestion)
        .where(eq(categoryAiSuggestion.transactionId, transactionId));
      expect(rows).toEqual([]);
    });
  });

  it("never includes household A's transactions in household B's own press", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedPendingTransaction(
        db,
        userA,
        householdScope(userA.session),
        "a3",
        "Padaria Estrela A",
      );
      await seedPendingTransaction(
        db,
        userB,
        householdScope(userB.session),
        "b1",
        "Mercado da Esquina B",
      );

      const client = createFakeAiClient();
      const requests: string[] = [];
      const recording: AiClient = {
        ...client,
        suggestCategories(request) {
          requests.push(request.user);
          return client.suggestCategories(request);
        },
      };
      const outcome = await requestCategorySuggestions(
        userB.session,
        db,
        {
          provider: providerFor(recording),
          encryptionKey: null,
          prompt: CURRENT_CATEGORY_SUGGESTER_PROMPT,
        },
        options(),
      );

      expect(outcome).toEqual(expect.objectContaining({ status: "ok" }));
      expect(requests).toHaveLength(1);
      const sentUserText = requests[0] ?? "";
      expect(sentUserText).toContain("Mercado da Esquina B");
      expect(sentUserText).not.toContain("Padaria Estrela A");
    });
  });

  it("stops reading and re-offers a transaction once its account moves to another household", async () => {
    await withTwoUsers(async ({ db, userA, householdA, householdB }) => {
      const connection = await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        itemId: crypto.randomUUID(),
        transactions: [
          seedTransaction({
            providerTransactionId: "a4",
            description: "Padaria Estrela A",
            date: "2026-10-15",
            amountCentavos: -2_000,
          }),
        ],
      });
      const transactionId = await transactionIdFor(db, "a4");
      const accountId = connection.accountIdsByProvider.get("acc-1") ?? "";

      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );
      const repositoryA = createCategorySuggestionsRepository({ householdId: householdA });
      expect((await repositoryA.readSuggestions(db, PROMPT_VERSION)).has(transactionId)).toBe(true);

      await joinHousehold(db, userA.id, householdB);
      expect(await moveSeededAccount(db, userA, accountId, householdB)).toBe("ok");

      expect((await repositoryA.readSuggestions(db, PROMPT_VERSION)).has(transactionId)).toBe(
        false,
      );
      const repositoryB = createCategorySuggestionsRepository({ householdId: householdB });
      expect((await repositoryB.readSuggestions(db, PROMPT_VERSION)).has(transactionId)).toBe(
        false,
      );

      const userBSession = { ...userA.session, householdId: householdB };
      expect(await requestCategorySuggestions(userBSession, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );
      expect((await repositoryB.readSuggestions(db, PROMPT_VERSION)).has(transactionId)).toBe(true);
    });
  });
});

describe("category_suggestion_run isolation (integration)", () => {
  it("keeps each household's own running check and daily quota apart", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const repositoryA = createCategorySuggestionsRepository({ householdId: householdA });
      const reserved = await repositoryA.reserveRun(db, {
        row: {
          localDay: "2026-11-10",
          promptVersion: PROMPT_VERSION,
          requestedModel: "claude-haiku-5-5",
          itemCount: 1,
          transactionCount: 1,
          requestedByUserId: userA.id,
        },
        limit: CATEGORY_SUGGESTION_RUNS_PER_DAY,
        staleBefore: new Date(0),
      });
      expect(reserved.status).toBe("reserved");

      await seedPendingTransaction(db, userB, householdScope(userB.session), "b2", "Mercado B");
      expect(await requestCategorySuggestions(userB.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );
    });
  });

  it("never lets household A's five runs exhaust household B's own quota", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdB }) => {
      for (let press = 0; press < CATEGORY_SUGGESTION_RUNS_PER_DAY; press += 1) {
        await seedPendingTransaction(
          db,
          userA,
          householdScope(userA.session),
          `a5-${String(press)}`,
          `Padaria A ${String(press)}`,
        );
        expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
          expect.objectContaining({ status: "ok" }),
        );
      }
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual({
        status: "quota_exhausted",
      });

      await seedPendingTransaction(db, userB, householdScope(userB.session), "b3", "Mercado B");
      expect(await requestCategorySuggestions(userB.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      const repositoryB = createCategorySuggestionsRepository({ householdId: householdB });
      expect(await repositoryB.countRunsOn(db, "2026-11-10")).toBe(1);
    });
  });
});

describe("category-suggestions run completion races (integration)", () => {
  it("leaves an already-succeeded run untouched when fail() is called on it afterwards", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const repository = createCategorySuggestionsRepository({ householdId: householdA });
      const reserved = await repository.reserveRun(db, {
        row: {
          localDay: "2026-11-10",
          promptVersion: PROMPT_VERSION,
          requestedModel: "claude-haiku-5-5",
          itemCount: 1,
          transactionCount: 1,
          requestedByUserId: userA.id,
        },
        limit: CATEGORY_SUGGESTION_RUNS_PER_DAY,
        staleBefore: new Date(0),
      });
      if (reserved.status !== "reserved") {
        throw new Error("reserveRun did not reserve a fresh run");
      }

      await repository.succeed(db, reserved.id, {
        model: "claude-haiku-5-5",
        inputTokens: 10,
        outputTokens: 5,
        suggestedCount: 1,
      });

      await repository.fail(db, reserved.id, {
        model: "claude-haiku-5-5",
        inputTokens: 10,
        outputTokens: 5,
        failureReason: "unavailable",
      });

      const [row] = await db
        .select({
          status: categorySuggestionRun.status,
          failureReason: categorySuggestionRun.failureReason,
          suggestedCount: categorySuggestionRun.suggestedCount,
        })
        .from(categorySuggestionRun)
        .where(eq(categorySuggestionRun.id, reserved.id));

      expect(row?.status).toBe("succeeded");
      expect(row?.failureReason).toBeNull();
      expect(row?.suggestedCount).toBe(1);
    });
  });
});

describe("category-suggestions concurrency and quota (integration)", () => {
  it("refuses a second press while one is already running, and frees a stale one", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedPendingTransaction(db, userA, householdScope(userA.session), "a6", "Padaria A");
      const repository = createCategorySuggestionsRepository({ householdId: householdA });
      const now = new Date();
      const reserved = await repository.reserveRun(db, {
        row: {
          localDay: "2026-11-10",
          promptVersion: PROMPT_VERSION,
          requestedModel: "claude-haiku-5-5",
          itemCount: 1,
          transactionCount: 1,
          requestedByUserId: userA.id,
        },
        limit: CATEGORY_SUGGESTION_RUNS_PER_DAY,
        staleBefore: new Date(0),
      });
      expect(reserved.status).toBe("reserved");

      expect(await requestCategorySuggestions(userA.session, db, deps(), options(now))).toEqual({
        status: "in_progress",
      });

      const later = new Date(now.getTime() + 6 * 60_000);
      expect(await requestCategorySuggestions(userA.session, db, deps(), options(later))).toEqual(
        expect.objectContaining({ status: "ok" }),
      );
    });
  });

  it("exhausts a household's own five-run daily quota on the sixth press", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      for (let press = 0; press < CATEGORY_SUGGESTION_RUNS_PER_DAY; press += 1) {
        await seedPendingTransaction(
          db,
          userA,
          householdScope(userA.session),
          `a7-${String(press)}`,
          `Padaria A ${String(press)}`,
        );
        expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
          expect.objectContaining({ status: "ok" }),
        );
      }

      await seedPendingTransaction(db, userA, householdScope(userA.session), "a7-5", "Padaria A 5");
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual({
        status: "quota_exhausted",
      });
    });
  });
});

describe("category-suggestions cascades (integration)", () => {
  it("deletes a suggestion when its transaction is deleted", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const transactionId = await seedPendingTransaction(
        db,
        userA,
        householdScope(userA.session),
        "a8",
        "Padaria A",
      );
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );
      const repository = createCategorySuggestionsRepository({ householdId: householdA });
      expect((await repository.readSuggestions(db, PROMPT_VERSION)).size).toBe(1);

      await db.delete(bankTransaction).where(eq(bankTransaction.id, transactionId));

      const rows = await db
        .select()
        .from(categoryAiSuggestion)
        .where(eq(categoryAiSuggestion.transactionId, transactionId));
      expect(rows).toEqual([]);
    });
  });

  it("deletes every row of both tables when the household is deleted", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedPendingTransaction(db, userA, householdScope(userA.session), "a9", "Padaria A");
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      await db.delete(organization).where(eq(organization.id, householdA));

      expect(
        await db
          .select()
          .from(categoryAiSuggestion)
          .where(eq(categoryAiSuggestion.householdId, householdA)),
      ).toEqual([]);
      expect(
        await db
          .select()
          .from(categorySuggestionRun)
          .where(eq(categorySuggestionRun.householdId, householdA)),
      ).toEqual([]);
    });
  });

  it("sets requested_by_user_id to null instead of deleting the run when the requester is deleted", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedPendingTransaction(db, userA, householdScope(userA.session), "a10", "Padaria A");
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      await db.delete(user).where(eq(user.id, userA.id));

      const [run] = await db
        .select()
        .from(categorySuggestionRun)
        .where(eq(categorySuggestionRun.householdId, householdA));
      expect(run?.requestedByUserId).toBeNull();
    });
  });
});

describe("category-suggestions prune (integration)", () => {
  it("deletes runs past 30 days and suggestions past 240 days, and nothing younger", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedPendingTransaction(db, userA, householdScope(userA.session), "a11", "Padaria A");
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      const old = new Date(NOW.getTime() - 400 * 24 * 60 * 60_000);
      await db
        .update(categorySuggestionRun)
        .set({ createdAt: old })
        .where(eq(categorySuggestionRun.householdId, householdA));
      await db
        .update(categoryAiSuggestion)
        .set({ createdAt: old })
        .where(eq(categoryAiSuggestion.householdId, householdA));

      const result = await runDailyPruneStep(db, NOW);
      expect(result).toMatchObject({ deleted: expect.any(Number) as unknown });
      if ("deleted" in result) {
        expect(result.deleted).toBeGreaterThanOrEqual(2);
      }

      expect(
        await db
          .select()
          .from(categorySuggestionRun)
          .where(eq(categorySuggestionRun.householdId, householdA)),
      ).toEqual([]);
      expect(
        await db
          .select()
          .from(categoryAiSuggestion)
          .where(eq(categoryAiSuggestion.householdId, householdA)),
      ).toEqual([]);
    });
  });

  it("keeps a run and a suggestion younger than their retention window", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      await seedPendingTransaction(db, userA, householdScope(userA.session), "a12", "Padaria A");
      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      await runDailyPruneStep(db, NOW);

      expect(
        await db
          .select()
          .from(categorySuggestionRun)
          .where(eq(categorySuggestionRun.householdId, householdA)),
      ).toHaveLength(1);
      expect(
        await db
          .select()
          .from(categoryAiSuggestion)
          .where(eq(categoryAiSuggestion.householdId, householdA)),
      ).toHaveLength(1);
    });
  });
});

describe("category suggestions feed guided categorization (integration)", () => {
  it("drops aiPendingCount once a press has asked for the household's only pending transaction", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedPendingTransaction(
        db,
        userA,
        householdScope(userA.session),
        "a13",
        "Padaria Estrela A",
      );

      const before = await getGuidedCategorizationProps(userA.session, NOW);
      expect(before.aiPendingCount).toBe(1);

      expect(await requestCategorySuggestions(userA.session, db, deps(), options())).toEqual(
        expect.objectContaining({ status: "ok" }),
      );

      const aiSuggestions = await readAiCategorySuggestions(userA.session);
      const after = await getGuidedCategorizationProps(userA.session, NOW, { aiSuggestions });
      expect(after.aiPendingCount).toBe(0);

      const transactionId = await transactionIdFor(db, "a13");
      const item = after.items.find((candidate) => candidate.id === transactionId);
      expect(item?.suggestion).toEqual(
        expect.objectContaining({
          value: "product:shopping.other",
          label: "Compras · Outras compras",
          source: "ai",
        }),
      );
    });
  });
});
