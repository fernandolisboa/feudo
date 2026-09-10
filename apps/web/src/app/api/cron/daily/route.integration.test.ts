import { randomUUID } from "node:crypto";

import {
  accumulate12MonthIpca,
  annualizeDailyPercentToRatePpm,
  parsePercentToRatePpm,
} from "@feudo/core";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { marketData } from "@/db/schema/market-data";
import { invitation, verification } from "@/db/schema/auth";
import { withTestDb } from "@/db/test/harness";
import * as marketDataModule from "@/lib/market-data";
import {
  CDI_DAILY_OBSERVATIONS,
  IPCA_MONTHLY_OBSERVATIONS,
  buildSgsFetchMock,
} from "@/lib/market-data/test/sgs-fixtures";
import * as authModule from "@/modules/auth";
import { getAuth } from "@/modules/auth";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";
import * as householdsModule from "@/modules/households";

import { GET } from "./route";

import type { Database } from "@/db/client";

const { getLatestIndicators } = marketDataModule;

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;
const ORIGINAL_FETCH = globalThis.fetch;

async function countMarketDataRows(db: Database, seriesCode: string): Promise<number> {
  const rows = await db.select().from(marketData).where(eq(marketData.seriesCode, seriesCode));
  return rows.length;
}

async function callCronRoute(): Promise<Response> {
  return GET(
    new Request("https://example.com/api/cron/daily", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
}

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

describe("GET /api/cron/daily (integration)", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    process.env.REGISTRATION_MODE = "open";
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("runs the market-data refresh and the verification prune in the same request, reporting both steps", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock({ notFoundSeriesCodes: ["13522"] });

      const expiredId = randomUUID();
      const validId = randomUUID();
      const now = new Date();
      await db.insert(verification).values([
        {
          id: expiredId,
          identifier: "reset-password:expired@example.com",
          value: "expired-user-id",
          expiresAt: new Date(now.getTime() - 60_000),
        },
        {
          id: validId,
          identifier: "reset-password:valid@example.com",
          value: "valid-user-id",
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ]);

      const response = await callCronRoute();
      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        ok: boolean;
        steps: {
          marketData: { ok: boolean; results: unknown[] };
          pruneVerification: { deleted: number };
          pruneInvitations: { deleted: number };
        };
      };
      expect(body.ok).toBe(true);
      expect(body.steps.marketData.ok).toBe(true);
      expect(body.steps.pruneVerification).toEqual({ deleted: 1 });
      expect(body.steps.pruneInvitations).toEqual({ deleted: 0 });

      expect(await countMarketDataRows(db, "12")).toBe(CDI_DAILY_OBSERVATIONS.length);
      expect(await countMarketDataRows(db, "13522")).toBe(0);

      const remainingVerification = await db.select().from(verification);
      expect(remainingVerification.map((row) => row.id)).toEqual([validId]);

      const indicators = await getLatestIndicators(db);
      expect(indicators.cdiAnnual).toEqual({
        ratePpm: annualizeDailyPercentToRatePpm("0.053701"),
        referenceDate: "2026-09-03",
        source: "computed",
      });
      expect(indicators.selicTarget).toEqual({
        ratePpm: parsePercentToRatePpm("15.00"),
        referenceDate: "2026-08-20",
        source: "sgs",
      });
      const expectedIpca12MonthPpm = accumulate12MonthIpca(
        IPCA_MONTHLY_OBSERVATIONS.map((observation) => parsePercentToRatePpm(observation.valor)),
      );
      expect(indicators.ipca12Month).toEqual({
        ratePpm: expectedIpca12MonthPpm,
        referenceDate: "2026-08-01",
        source: "computed",
      });
    });
  });

  it("returns ok: false with a 500 status when the market-data step could not fetch any series, while still pruning expired verification rows", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock({ everySeriesFails: true });

      const expiredId = randomUUID();
      await db.insert(verification).values({
        id: expiredId,
        identifier: "reset-password:expired@example.com",
        value: "expired-user-id",
        expiresAt: new Date(Date.now() - 60_000),
      });

      const response = await callCronRoute();
      expect(response.status).toBe(500);
      const body = (await response.json()) as {
        ok: boolean;
        steps: {
          marketData: { ok: boolean };
          pruneVerification: { deleted: number };
          pruneInvitations: { deleted: number };
        };
      };
      expect(body.ok).toBe(false);
      expect(body.steps.marketData.ok).toBe(false);
      expect(body.steps.pruneVerification).toEqual({ deleted: 1 });
      expect(body.steps.pruneInvitations).toEqual({ deleted: 0 });

      expect(await countMarketDataRows(db, "12")).toBe(0);
      const remainingVerification = await db.select().from(verification);
      expect(remainingVerification).toHaveLength(0);
    });
  });

  it("returns 401 when the bearer token is missing, without running either step", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock();

      const expiredId = randomUUID();
      await db.insert(verification).values({
        id: expiredId,
        identifier: "reset-password:expired@example.com",
        value: "expired-user-id",
        expiresAt: new Date(Date.now() - 60_000),
      });

      const response = await GET(new Request("https://example.com/api/cron/daily"));
      expect(response.status).toBe(401);

      expect(await countMarketDataRows(db, "12")).toBe(0);
      const remainingVerification = await db.select().from(verification);
      expect(remainingVerification).toHaveLength(1);
    });
  });

  it("prunes only expired verification rows, leaving unexpired ones untouched", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock();

      const expiredId = randomUUID();
      const validId = randomUUID();
      const now = new Date();
      await db.insert(verification).values([
        {
          id: expiredId,
          identifier: "reset-password:expired@example.com",
          value: "expired-user-id",
          expiresAt: new Date(now.getTime() - 60_000),
        },
        {
          id: validId,
          identifier: "reset-password:valid@example.com",
          value: "valid-user-id",
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ]);

      const response = await callCronRoute();
      expect(response.status).toBe(200);

      const remaining = await db
        .select()
        .from(verification)
        .where(and(eq(verification.id, expiredId)));
      expect(remaining).toHaveLength(0);

      const survivor = await db.select().from(verification).where(eq(verification.id, validId));
      expect(survivor).toHaveLength(1);
    });
  });

  it("prunes expired and cancelled invitations, leaving pending ones untouched", async () => {
    await withTestDb(async (db) => {
      globalThis.fetch = buildSgsFetchMock();

      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "prune-owner@example.com",
        password: "correct-horse",
      });
      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: randomUUID() },
      });
      const ownerSession = await getAuth().api.getSession({ headers: ownerHeaders });
      if (!ownerSession) throw new Error("owner sign-in failed in test setup");

      const expiredId = randomUUID();
      const cancelledId = randomUUID();
      const pendingId = randomUUID();
      const now = new Date();
      await db.insert(invitation).values([
        {
          id: expiredId,
          organizationId: organization.id,
          email: "expired-invite@example.com",
          role: "member",
          status: "pending",
          expiresAt: new Date(now.getTime() - 60_000),
          inviterId: ownerSession.user.id,
        },
        {
          id: cancelledId,
          organizationId: organization.id,
          email: "cancelled-invite@example.com",
          role: "member",
          status: "canceled",
          expiresAt: new Date(now.getTime() + 60_000),
          inviterId: ownerSession.user.id,
        },
        {
          id: pendingId,
          organizationId: organization.id,
          email: "pending-invite@example.com",
          role: "member",
          status: "pending",
          expiresAt: new Date(now.getTime() + 60_000),
          inviterId: ownerSession.user.id,
        },
      ]);

      const response = await callCronRoute();
      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        steps: { pruneInvitations: { deleted: number } };
      };
      expect(body.steps.pruneInvitations).toEqual({ deleted: 2 });

      const remaining = await db.select({ id: invitation.id }).from(invitation);
      expect(remaining.map((row) => row.id)).toEqual([pendingId]);
    });
  });

  it("runs housekeeping before the market-data refresh, so a Bacen outage cannot starve it", async () => {
    await withTestDb(async () => {
      globalThis.fetch = buildSgsFetchMock();
      const callOrder: string[] = [];
      const actualPruneVerification = authModule.pruneExpiredVerifications;
      const actualPruneInvitations = householdsModule.pruneExpiredInvitations;
      const actualRefresh = marketDataModule.refreshMarketData;
      vi.spyOn(authModule, "pruneExpiredVerifications").mockImplementation(async (...args) => {
        callOrder.push("pruneVerification");
        return actualPruneVerification(...args);
      });
      vi.spyOn(householdsModule, "pruneExpiredInvitations").mockImplementation(async (...args) => {
        callOrder.push("pruneInvitations");
        return actualPruneInvitations(...args);
      });
      vi.spyOn(marketDataModule, "refreshMarketData").mockImplementation(async (...args) => {
        callOrder.push("marketData");
        return actualRefresh(...args);
      });

      const response = await callCronRoute();
      expect(response.status).toBe(200);
      expect(callOrder).toEqual(["pruneVerification", "pruneInvitations", "marketData"]);
    });
  });

  it("keeps running the remaining steps and still returns 500 when the verification prune throws", async () => {
    await withTestDb(async () => {
      globalThis.fetch = buildSgsFetchMock();
      vi.spyOn(authModule, "pruneExpiredVerifications").mockRejectedValue(
        new Error("connection reset"),
      );

      const response = await callCronRoute();
      expect(response.status).toBe(500);
      const body = (await response.json()) as {
        ok: boolean;
        steps: {
          marketData: { ok: boolean };
          pruneVerification: { error: string };
          pruneInvitations: { deleted: number };
        };
      };
      expect(body.ok).toBe(false);
      expect(body.steps.marketData.ok).toBe(true);
      expect(body.steps.pruneVerification).toEqual({ error: "Error" });
      expect(body.steps.pruneInvitations).toEqual({ deleted: 0 });
    });
  });

  it("keeps running the remaining steps and still returns 500 when the invitation prune throws", async () => {
    await withTestDb(async () => {
      globalThis.fetch = buildSgsFetchMock();
      vi.spyOn(householdsModule, "pruneExpiredInvitations").mockRejectedValue(
        new Error("connection reset"),
      );

      const response = await callCronRoute();
      expect(response.status).toBe(500);
      const body = (await response.json()) as {
        ok: boolean;
        steps: {
          marketData: { ok: boolean };
          pruneVerification: { deleted: number };
          pruneInvitations: { error: string };
        };
      };
      expect(body.ok).toBe(false);
      expect(body.steps.marketData.ok).toBe(true);
      expect(body.steps.pruneVerification).toEqual({ deleted: 0 });
      expect(body.steps.pruneInvitations).toEqual({ error: "Error" });
    });
  });
});
