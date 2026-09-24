import { z } from "zod";

import type { DocumentHasher } from "../document-hash";
import {
  normalizeAccount,
  normalizeInvestment,
  normalizeItem,
  normalizeTransaction,
} from "./pluggy-normalize";
import {
  pluggyAccountSchema,
  pluggyAuthResponseSchema,
  pluggyCursorPageSchema,
  pluggyInvestmentSchema,
  pluggyItemSchema,
  pluggyPageSchema,
  pluggyTransactionSchema,
} from "./pluggy-schemas";
import {
  ProviderListingTooLongError,
  ProviderReadAbortedError,
  ProviderResponseShapeError,
  ProviderUnavailableError,
  type AuthenticateOutcome,
  type DataProvider,
  type DescribeConnectionOutcome,
  type NormalizedAccount,
  type NormalizedTransaction,
  type ProviderClient,
  type ProviderCredentials,
} from "./provider";

const PLUGGY_BASE_URL = "https://api.pluggy.ai";
const REQUEST_TIMEOUT_MS = 15_000;
const PAGE_SIZE = 500;
// Bounds the number of pages one sync walks so a provider that never reports
// a last page cannot keep a serverless function alive indefinitely.
const MAX_PAGES = 40;

type PluggyProviderOptions = {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

async function requestJson(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  endpoint: string,
  runSignal?: AbortSignal,
): Promise<{ status: number; json: unknown }> {
  let response: Response;
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = runSignal ? AbortSignal.any([timeoutSignal, runSignal]) : timeoutSignal;
  try {
    response = await fetchImpl(url, { ...init, signal });
  } catch {
    // AbortSignal.any does not say which of its signals fired, so the run's
    // own signal is checked directly: still aborted means the deadline cut
    // this read, not the per-request timeout.
    if (runSignal?.aborted) {
      throw new ProviderReadAbortedError(endpoint);
    }
    throw new ProviderUnavailableError(`network request to ${endpoint} failed`);
  }
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    if (response.ok) {
      throw new ProviderResponseShapeError(endpoint);
    }
  }
  return { status: response.status, json };
}

const MAX_REPORTED_FIELDS = 5;

function shapeIssueFields(error: z.ZodError): string[] {
  const fields = new Set<string>();
  for (const issue of error.issues) {
    // An array index says only "one of them", so it collapses to `#`: a page
    // where every transaction misses the same field then reports that field
    // once instead of five hundred times.
    const path = issue.path.map((key) => (typeof key === "number" ? "#" : String(key))).join(".");
    fields.add(`${path === "" ? "(root)" : path}:${issue.code}`);
    if (fields.size >= MAX_REPORTED_FIELDS) {
      break;
    }
  }
  return [...fields];
}

function parseOrThrow<Schema extends z.ZodType>(
  schema: Schema,
  json: unknown,
  endpoint: string,
): z.infer<Schema> {
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ProviderResponseShapeError(endpoint, shapeIssueFields(parsed.error));
  }
  return parsed.data;
}

class PluggyClient implements ProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch,
    private readonly hasher: DocumentHasher,
    private readonly runSignal?: AbortSignal,
  ) {}

  private async get(endpoint: string, query: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
    const { status, json } = await requestJson(
      this.fetchImpl,
      url.toString(),
      { headers: { "X-API-KEY": this.apiKey, Accept: "application/json" } },
      endpoint,
      this.runSignal,
    );
    if (status === 404) {
      return null;
    }
    if (status < 200 || status >= 300) {
      throw new ProviderUnavailableError(
        `unexpected status ${String(status)} from ${endpoint}`,
        status,
      );
    }
    return json;
  }

  private async getAllPages<Item>(
    endpoint: string,
    query: Record<string, string>,
    itemSchema: z.ZodType<Item>,
  ): Promise<Item[]> {
    const pageSchema = pluggyPageSchema(itemSchema);
    const items: Item[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const json = await this.get(endpoint, {
        ...query,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const parsed = parseOrThrow(pageSchema, json, endpoint);
      // A server that ignores the requested page (a pageSize above its cap
      // is one known cause) would echo page 1 forever: that is a shape Feudo
      // does not understand, not a longer listing.
      if (parsed.page !== page) {
        throw new ProviderResponseShapeError(endpoint);
      }
      items.push(...parsed.results);
      if (parsed.page >= parsed.totalPages) {
        return items;
      }
    }
    // A listing whose last page is exactly MAX_PAGES already returned above;
    // reaching here means the provider still has more to offer past the cap.
    throw new ProviderListingTooLongError(endpoint);
  }

  // `path` is what goes on the wire; `collection` is what a failure is reported
  // as. They are the same word for every listing but the versioned ones, and a
  // reader of the logs wants the listing that broke, not the API version.
  private async getAllByCursor<Item>(
    path: string,
    collection: string,
    query: Record<string, string>,
    itemSchema: z.ZodType<Item>,
  ): Promise<Item[]> {
    const pageSchema = pluggyCursorPageSchema(itemSchema);
    const items: Item[] = [];
    const seen = new Set<string>();
    let after: string | undefined;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const json = await this.get(path, after === undefined ? query : { ...query, after });
      const parsed = parseOrThrow(pageSchema, json, collection);
      items.push(...parsed.results);
      if (parsed.next === null || parsed.next === undefined) {
        return items;
      }
      // Pluggy documents sending only the decoded `after` from `next` rather
      // than pasting the whole string onto the path, so nothing the provider
      // returns can steer the request elsewhere. A cursor already used would
      // page in a circle, and catching that here rather than at the cap saves
      // the rest of the round trips.
      const next = new URLSearchParams(parsed.next).get("after");
      if (next === null || seen.has(next)) {
        throw new ProviderResponseShapeError(collection);
      }
      seen.add(next);
      after = next;
    }
    // Returning at the cap while the provider still offers a cursor would hand
    // back a truncated window, which the caller stores and then treats as fully
    // synced: everything past the cap would never be asked for again.
    throw new ProviderListingTooLongError(collection);
  }

  async describeConnection(providerItemId: string): Promise<DescribeConnectionOutcome> {
    const endpoint = `items/${encodeURIComponent(providerItemId)}`;
    const json = await this.get(endpoint, {});
    if (json === null) {
      return { status: "not_found" };
    }
    return {
      status: "ok",
      connection: normalizeItem(parseOrThrow(pluggyItemSchema, json, endpoint)),
    };
  }

  async listAccounts(providerItemId: string): Promise<NormalizedAccount[]> {
    const accounts = await this.getAllPages(
      "accounts",
      { itemId: providerItemId },
      pluggyAccountSchema,
    );
    return accounts
      .map((account) => normalizeAccount(account, this.hasher))
      .filter((account) => account !== null);
  }

  async listInvestmentPositions(providerItemId: string): Promise<NormalizedAccount[]> {
    const investments = await this.getAllPages(
      "investments",
      { itemId: providerItemId },
      pluggyInvestmentSchema,
    );
    return investments
      .filter((investment) => investment.status !== "TOTAL_WITHDRAWAL")
      .map((investment) => normalizeInvestment(investment, this.hasher));
  }

  async listTransactionsSince(
    providerAccountId: string,
    sinceISODate: string,
  ): Promise<NormalizedTransaction[]> {
    const transactions = await this.getAllByCursor(
      "v2/transactions",
      "transactions",
      { accountId: providerAccountId, dateFrom: sinceISODate },
      pluggyTransactionSchema,
    );
    return transactions.map((transaction) => normalizeTransaction(transaction, this.hasher));
  }
}

export function createPluggyProvider(
  hasher: DocumentHasher,
  options: PluggyProviderOptions = {},
): DataProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? PLUGGY_BASE_URL;

  return {
    name: "pluggy",
    async authenticate(
      credentials: ProviderCredentials,
      options?: { signal?: AbortSignal },
    ): Promise<AuthenticateOutcome> {
      const { status, json } = await requestJson(
        fetchImpl,
        `${baseUrl}/auth`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            nonExpiring: false,
          }),
        },
        "auth",
        options?.signal,
      );
      if (status === 401 || status === 403) {
        return { status: "invalid_credentials" };
      }
      if (status < 200 || status >= 300) {
        throw new ProviderUnavailableError(`unexpected status ${String(status)} from auth`, status);
      }
      const { apiKey } = parseOrThrow(pluggyAuthResponseSchema, json, "auth");
      return {
        status: "ok",
        client: new PluggyClient(apiKey, baseUrl, fetchImpl, hasher, options?.signal),
      };
    },
  };
}
