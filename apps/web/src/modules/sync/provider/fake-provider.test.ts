import { describe, expect, it } from "vitest";

import { createDocumentHasher } from "../document-hash";
import {
  FAKE_INVALID_CLIENT_SECRET,
  FAKE_ITEM_BANCO_FIXTURE,
  FAKE_ITEM_CORRETORA_FIXTURE,
} from "./fake-fixtures";
import { createFakeProvider } from "./fake-provider";

const provider = createFakeProvider(
  createDocumentHasher("unit-test-document-hash-key-with-32-chars!!"),
);

async function client() {
  const outcome = await provider.authenticate({ clientId: "any", clientSecret: "any" });
  if (outcome.status !== "ok") {
    throw new Error("expected ok");
  }
  return outcome.client;
}

describe("createFakeProvider", () => {
  it("accepts any credentials except the reserved invalid secret", async () => {
    await expect(
      provider.authenticate({ clientId: "any", clientSecret: FAKE_INVALID_CLIENT_SECRET }),
    ).resolves.toEqual({ status: "invalid_credentials" });
    await expect(
      provider.authenticate({ clientId: "any", clientSecret: "ok" }),
    ).resolves.toMatchObject({ status: "ok" });
  });

  it("describes only the fixture items", async () => {
    const fake = await client();
    await expect(fake.describeConnection(FAKE_ITEM_BANCO_FIXTURE)).resolves.toMatchObject({
      status: "ok",
      connection: { institutionName: "Banco Fixture" },
    });
    await expect(fake.describeConnection(FAKE_ITEM_CORRETORA_FIXTURE)).resolves.toMatchObject({
      status: "ok",
      connection: { institutionName: "Corretora Fixture" },
    });
    await expect(fake.describeConnection("unknown")).resolves.toEqual({ status: "not_found" });
  });

  it("returns normalized fixture accounts and positions", async () => {
    const fake = await client();
    const accounts = await fake.listAccounts(FAKE_ITEM_BANCO_FIXTURE);
    expect(accounts).toHaveLength(4);
    expect(accounts.every((account) => Number.isInteger(account.balanceCentavos))).toBe(true);
    const positions = await fake.listInvestmentPositions(FAKE_ITEM_CORRETORA_FIXTURE);
    expect(positions).toHaveLength(1);
    expect(positions[0]?.type).toBe("investment");
    await expect(fake.listAccounts("unknown")).resolves.toEqual([]);
  });

  it("filters transactions by the since date", async () => {
    const fake = await client();
    const all = await fake.listTransactionsSince(
      "a1000000-0000-4000-8000-000000000001",
      "2026-09-01",
    );
    const later = await fake.listTransactionsSince(
      "a1000000-0000-4000-8000-000000000001",
      "2026-09-17",
    );
    expect(all).toHaveLength(3);
    expect(later).toHaveLength(1);
    await expect(fake.refresh(FAKE_ITEM_BANCO_FIXTURE)).resolves.toBeUndefined();
  });
});
