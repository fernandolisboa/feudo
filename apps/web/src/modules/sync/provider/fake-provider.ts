import type { DocumentHasher } from "../document-hash";
import {
  FAKE_ACCOUNTS,
  FAKE_INVALID_CLIENT_SECRET,
  FAKE_INVESTMENTS,
  FAKE_ITEMS,
  FAKE_TRANSACTIONS,
} from "./fake-fixtures";
import {
  normalizeAccount,
  normalizeInvestment,
  normalizeItem,
  normalizeTransaction,
} from "./pluggy-normalize";
import type {
  AuthenticateOutcome,
  DataProvider,
  DescribeConnectionOutcome,
  NormalizedAccount,
  NormalizedTransaction,
  ProviderClient,
  ProviderCredentials,
} from "./provider";

// Runs the same normalizer as the Pluggy provider over Pluggy-shaped
// fixtures, so a preview or a test exercises every byte of the pipeline
// except the HTTP call. Meu Pluggy has no sandbox (ADR-0005).
class FakeClient implements ProviderClient {
  constructor(private readonly hasher: DocumentHasher) {}

  describeConnection(providerItemId: string): Promise<DescribeConnectionOutcome> {
    const item = FAKE_ITEMS[providerItemId];
    if (!item) {
      return Promise.resolve({ status: "not_found" });
    }
    return Promise.resolve({ status: "ok", connection: normalizeItem(item) });
  }

  listAccounts(providerItemId: string): Promise<NormalizedAccount[]> {
    const accounts = FAKE_ACCOUNTS[providerItemId] ?? [];
    return Promise.resolve(
      accounts
        .map((account) => normalizeAccount(account, this.hasher))
        .filter((account) => account !== null),
    );
  }

  listInvestmentPositions(providerItemId: string): Promise<NormalizedAccount[]> {
    const investments = FAKE_INVESTMENTS[providerItemId] ?? [];
    return Promise.resolve(
      investments.map((investment) => normalizeInvestment(investment, this.hasher)),
    );
  }

  listTransactionsSince(
    providerAccountId: string,
    sinceISODate: string,
  ): Promise<NormalizedTransaction[]> {
    const transactions = FAKE_TRANSACTIONS[providerAccountId] ?? [];
    return Promise.resolve(
      transactions
        .map((transaction) => normalizeTransaction(transaction, this.hasher))
        .filter((transaction) => transaction.date >= sinceISODate),
    );
  }

  refresh(): Promise<void> {
    return Promise.resolve();
  }
}

export function createFakeProvider(hasher: DocumentHasher): DataProvider {
  return {
    name: "fake",
    authenticate(credentials: ProviderCredentials): Promise<AuthenticateOutcome> {
      if (credentials.clientSecret === FAKE_INVALID_CLIENT_SECRET) {
        return Promise.resolve({ status: "invalid_credentials" });
      }
      return Promise.resolve({ status: "ok", client: new FakeClient(hasher) });
    },
  };
}
