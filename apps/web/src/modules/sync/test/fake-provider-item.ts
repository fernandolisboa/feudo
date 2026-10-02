import { createDocumentHasher } from "../document-hash";
import { createFakeProvider } from "../provider/fake-provider";
import type { NormalizedAccount } from "../provider/provider";

export { FAKE_ITEM_BANCO_FIXTURE, FAKE_ITEM_CORRETORA_FIXTURE } from "../provider/fake-fixtures";

// What a sync of one fake-provider item would store as accounts: its bank
// accounts and its investment positions, through the same normalizer the
// Pluggy provider runs, so another slice's test reads the fixtures exactly
// as a real sync would leave them.
export async function readFakeProviderItem(itemId: string): Promise<NormalizedAccount[]> {
  const outcome = await createFakeProvider(createDocumentHasher("test-document-key")).authenticate({
    clientId: "client",
    clientSecret: "secret",
  });
  if (outcome.status !== "ok") {
    throw new Error("fake provider refused the test credentials");
  }
  const [accounts, investments] = await Promise.all([
    outcome.client.listAccounts(itemId),
    outcome.client.listInvestmentPositions(itemId),
  ]);
  return [...accounts, ...investments];
}
