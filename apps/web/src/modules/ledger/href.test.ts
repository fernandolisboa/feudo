import { describe, expect, it } from "vitest";

import { transactionsHref } from "./href";

describe("transactionsHref", () => {
  it("always carries the month and only the non-default filters", () => {
    expect(transactionsHref({ month: "2026-09", accountId: null, page: 1 })).toBe(
      "/transacoes?mes=2026-09",
    );
    expect(transactionsHref({ month: "2026-09", accountId: "acc 1", page: 3 })).toBe(
      "/transacoes?mes=2026-09&conta=acc+1&pagina=3",
    );
  });
});
