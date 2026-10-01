import { describe, expect, it } from "vitest";
import { formatMoney, formatYearMonth } from "@feudo/core";

import { householdScope } from "@/modules/households";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import {
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
} from "./repository";
import { getReservePageProps } from "./page-props";
import { t } from "./strings";

// Same instant overview-page-props.integration.test.ts anchors its own
// month on: 01:30 UTC on 1 October 2026 is still 30 September 2026 in
// America/Sao_Paulo, the default time zone with no settings row.
const NOW = new Date("2026-10-01T01:30:00.000Z");

describe("getReservePageProps (integration)", () => {
  it("shows the no-accounts empty state when the household has no bank account", async () => {
    await withTwoUsers(async ({ userA }) => {
      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasAccounts).toBe(false);
      expect(props.hasHistory).toBe(false);
      expect(props.headline).toBe(t.headline.noAccounts);
      expect(props.tiles).toBeNull();
    });
  });

  it("shows the no-history empty state when the household has accounts but nothing categorized in the window", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedSyncedConnection(db, userA, { household: scope, transactions: [] });

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasAccounts).toBe(true);
      expect(props.hasHistory).toBe(false);
      expect(props.headline).toBe(t.headline.noHistory);
      expect(props.tiles).toBeNull();
    });
  });

  it("computes the live target from the same window the month-close job would use, and lists the notice when one is undismissed", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedSyncedConnection(db, userA, {
        household: scope,
        transactions: [
          seedTransaction({
            providerTransactionId: "fixed-june",
            date: "2026-06-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -90000,
          }),
          seedTransaction({
            providerTransactionId: "fixed-july",
            date: "2026-07-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -60000,
          }),
          seedTransaction({
            providerTransactionId: "fixed-august",
            date: "2026-08-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -90000,
          }),
        ],
      });
      await createReserveTargetRecordRepository(scope).insert(db, {
        closedMonth: "2026-07",
        averageFixedCostCentavos: 20000,
        monthsUsed: 1,
        isEstimate: true,
        reserveMultiple: 6,
        targetCentavos: 120000,
        currency: "BRL",
      });
      await createReserveTargetNoticeRepository(scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 120000,
        newTargetCentavos: 480000,
      });

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasAccounts).toBe(true);
      expect(props.hasHistory).toBe(true);
      expect(props.multiple).toBe(6);
      expect(props.tiles?.target.value).toBe(
        formatMoney({ amountCentavos: 480000, currency: "BRL" }),
      );
      expect(props.tiles?.averageFixedCost.value).toBe(
        formatMoney({ amountCentavos: 80000, currency: "BRL" }),
      );
      const expectedMonths = `${formatYearMonth("2026-06")}, ${formatYearMonth("2026-07")} e ${formatYearMonth("2026-08")}`;
      expect(props.tiles?.averageFixedCost.meta).toBe(`média de: ${expectedMonths}`);
      expect(props.notice).not.toBeNull();
      expect(props.notice?.message).toContain(
        formatMoney({ amountCentavos: 120000, currency: "BRL" }),
      );
      expect(props.notice?.message).toContain(
        formatMoney({ amountCentavos: 480000, currency: "BRL" }),
      );
    });
  });

  it("does not list a notice once it has been dismissed", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await createReserveTargetNoticeRepository(scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 120000,
        newTargetCentavos: 480000,
      });
      const notice = await createReserveTargetNoticeRepository(scope).getUndismissed(db);
      if (!notice) throw new Error("test setup: notice was not created");
      await createReserveTargetNoticeRepository(scope).dismiss(db, notice.id);

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.notice).toBeNull();
    });
  });
});
