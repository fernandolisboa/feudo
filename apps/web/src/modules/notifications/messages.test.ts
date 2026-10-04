import { describe, expect, it } from "vitest";

import { parsePushPayload } from "@/lib/push-payload";

import { householdEventPayload, userEventPayload } from "./messages";

const payloads = [
  householdEventPayload(
    { kind: "reserve_target_moved", closedMonth: "2026-09" },
    "h1",
    "Casa Lisboa",
  ),
  householdEventPayload({ kind: "monthly_analysis_ready", month: "2026-09" }, "h1", "Casa Lisboa"),
  userEventPayload({ kind: "sync_failing", connectionId: "c1", institutionName: "Nubank" }),
];

describe("push payloads", () => {
  it("says what happened, where, and opens the screen about it", () => {
    expect(payloads).toEqual([
      {
        title: "A meta da reserva mudou",
        body: "Casa Lisboa: a meta da reserva mudou mais de 10% no fechamento do mês. Veja na Reserva.",
        url: "/reserva",
        tag: "reserve-target:h1:2026-09",
      },
      {
        title: "A leitura do mês está pronta",
        body: "Casa Lisboa: a leitura do analista de setembro de 2026 está pronta.",
        url: "/",
        tag: "monthly-analysis:h1:2026-09",
      },
      {
        title: "A sincronização está falhando",
        body: "Nubank não sincronizou nas últimas três tentativas. Veja o que fazer em Suas conexões, na Visão geral.",
        url: "/",
        tag: "sync-failing:c1",
      },
    ]);
  });

  it("never carries an amount", () => {
    for (const payload of payloads) {
      expect(`${payload.title} ${payload.body}`).not.toMatch(/R\$|\d+,\d{2}/);
    }
  });

  it("is something the service worker accepts, even with the longest household name", () => {
    const longName = "C".repeat(120);
    for (const payload of [
      ...payloads,
      householdEventPayload(
        { kind: "reserve_target_moved", closedMonth: "2026-09" },
        "h1",
        longName,
      ),
    ]) {
      expect(parsePushPayload(payload)).toEqual(payload);
    }
  });

  it("keeps a household name containing a placeholder as typed", () => {
    const payload = householdEventPayload(
      { kind: "monthly_analysis_ready", month: "2026-09" },
      "h1",
      "Casa {month}",
    );
    expect(payload.body).toBe(
      "Casa {month}: a leitura do analista de setembro de 2026 está pronta.",
    );
  });
});
