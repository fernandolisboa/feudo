import { describe, expect, it } from "vitest";

import { lastUpdatedLabel } from "./offline-freshness";

const SAO_PAULO = "America/Sao_Paulo";

describe("lastUpdatedLabel", () => {
  const now = new Date("2026-10-04T14:00:00Z");

  it("says today with the household's local time", () => {
    expect(lastUpdatedLabel(new Date("2026-10-04T13:32:00Z"), now, SAO_PAULO)).toBe(
      "Última atualização: hoje, 10:32.",
    );
  });

  it("says yesterday for the household's previous calendar day", () => {
    expect(lastUpdatedLabel(new Date("2026-10-03T21:05:00Z"), now, SAO_PAULO)).toBe(
      "Última atualização: ontem, 18:05.",
    );
  });

  it("uses the household's day, not UTC's, near midnight", () => {
    expect(
      lastUpdatedLabel(
        new Date("2026-10-05T02:30:00Z"),
        new Date("2026-10-05T02:45:00Z"),
        SAO_PAULO,
      ),
    ).toBe("Última atualização: hoje, 23:30.");
  });

  it("gives the date for anything older", () => {
    expect(lastUpdatedLabel(new Date("2026-10-01T12:00:00Z"), now, SAO_PAULO)).toBe(
      "Última atualização: 01/10/2026, 09:00.",
    );
  });
});
