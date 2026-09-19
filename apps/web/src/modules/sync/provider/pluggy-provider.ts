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
  pluggyInvestmentSchema,
  pluggyItemSchema,
  pluggyPageSchema,
  pluggyTransactionSchema,
} from "./pluggy-schemas";
import {
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
): Promise<{ status: number; json: unknown }> {
  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
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

function parseOrThrow<Schema extends z.ZodType>(
  schema: Schema,
  json: unknown,
  endpoint: string,
): z.infer<Schema> {
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ProviderResponseShapeError(endpoint);
  }
  return parsed.data;
}

class PluggyClient implements ProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch,
    private readonly hasher: DocumentHasher,
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
      items.push(...parsed.results);
      if (parsed.page >= parsed.totalPages) {
        break;
      }
    }
    return items;
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
    return accounts.map((account) => normalizeAccount(account, this.hasher));
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
    const transactions = await this.getAllPages(
      "transactions",
      { accountId: providerAccountId, from: sinceISODate },
      pluggyTransactionSchema,
    );
    return transactions.map((transaction) => normalizeTransaction(transaction, this.hasher));
  }

  async refresh(providerItemId: string): Promise<void> {
    const endpoint = `items/${encodeURIComponent(providerItemId)}`;
    const { status } = await requestJson(
      this.fetchImpl,
      `${this.baseUrl}/${endpoint}`,
      {
        method: "PATCH",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: "{}",
      },
      endpoint,
    );
    if (status < 200 || status >= 300) {
      throw new ProviderUnavailableError(
        `unexpected status ${String(status)} from ${endpoint}`,
        status,
      );
    }
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
    async authenticate(credentials: ProviderCredentials): Promise<AuthenticateOutcome> {
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
      );
      if (status === 401 || status === 403) {
        return { status: "invalid_credentials" };
      }
      if (status < 200 || status >= 300) {
        throw new ProviderUnavailableError(`unexpected status ${String(status)} from auth`, status);
      }
      const { apiKey } = parseOrThrow(pluggyAuthResponseSchema, json, "auth");
      return { status: "ok", client: new PluggyClient(apiKey, baseUrl, fetchImpl, hasher) };
    },
  };
}
