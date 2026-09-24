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
import {
  ProviderReadAbortedError,
  type AuthenticateOutcome,
  type DataProvider,
  type DescribeConnectionOutcome,
  type NormalizedAccount,
  type NormalizedTransaction,
  type ProviderClient,
  type ProviderCredentials,
} from "./provider";

// Runs the same normalizer as the Pluggy provider over Pluggy-shaped
// fixtures, so a preview or a test exercises every byte of the pipeline
// except the HTTP call. Meu Pluggy has no sandbox (ADR-0005).
class FakeClient implements ProviderClient {
  constructor(
    private readonly hasher: DocumentHasher,
    private readonly runSignal?: AbortSignal,
  ) {}

  private ensureNotAborted(endpoint: string): void {
    if (this.runSignal?.aborted) {
      throw new ProviderReadAbortedError(endpoint);
    }
  }

  describeConnection(providerItemId: string): Promise<DescribeConnectionOutcome> {
    this.ensureNotAborted("items");
    const item = FAKE_ITEMS[providerItemId];
    if (!item) {
      return Promise.resolve({ status: "not_found" });
    }
    return Promise.resolve({ status: "ok", connection: normalizeItem(item) });
  }

  listAccounts(providerItemId: string): Promise<NormalizedAccount[]> {
    this.ensureNotAborted("accounts");
    const accounts = FAKE_ACCOUNTS[providerItemId] ?? [];
    return Promise.resolve(
      accounts
        .map((account) => normalizeAccount(account, this.hasher))
        .filter((account) => account !== null),
    );
  }

  listInvestmentPositions(providerItemId: string): Promise<NormalizedAccount[]> {
    this.ensureNotAborted("investments");
    const investments = FAKE_INVESTMENTS[providerItemId] ?? [];
    return Promise.resolve(
      investments.map((investment) => normalizeInvestment(investment, this.hasher)),
    );
  }

  listTransactionsSince(
    providerAccountId: string,
    sinceISODate: string,
  ): Promise<NormalizedTransaction[]> {
    this.ensureNotAborted("transactions");
    const transactions = FAKE_TRANSACTIONS[providerAccountId] ?? [];
    return Promise.resolve(
      transactions
        .map((transaction) => normalizeTransaction(transaction, this.hasher))
        .filter((transaction) => transaction.date >= sinceISODate),
    );
  }
}

export function createFakeProvider(hasher: DocumentHasher): DataProvider {
  return {
    name: "fake",
    authenticate(
      credentials: ProviderCredentials,
      options?: { signal?: AbortSignal },
    ): Promise<AuthenticateOutcome> {
      if (options?.signal?.aborted) {
        return Promise.reject(new ProviderReadAbortedError("auth"));
      }
      if (credentials.clientSecret === FAKE_INVALID_CLIENT_SECRET) {
        return Promise.resolve({ status: "invalid_credentials" });
      }
      return Promise.resolve({ status: "ok", client: new FakeClient(hasher, options?.signal) });
    },
  };
}
