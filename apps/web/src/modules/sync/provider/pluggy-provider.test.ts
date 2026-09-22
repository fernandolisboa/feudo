import { describe, expect, it } from "vitest";

import { createDocumentHasher } from "../document-hash";
import {
  FAKE_ACCOUNTS,
  FAKE_INVESTMENTS,
  FAKE_ITEM_BANCO_FIXTURE,
  FAKE_ITEMS,
  FAKE_TRANSACTIONS,
} from "./fake-fixtures";
import { createPluggyProvider } from "./pluggy-provider";
import { ProviderResponseShapeError, ProviderUnavailableError } from "./provider";

const hasher = createDocumentHasher("unit-test-document-hash-key-with-32-chars!!");
const credentials = { clientId: "client-id", clientSecret: "client-secret" };
const CHECKING_ACCOUNT_FIXTURE = "a1000000-0000-4000-8000-000000000001";

type Route = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type RecordedCall = { url: string; method: string; headers: Headers; body: string };

const recordedCalls: RecordedCall[] = [];

function requestBody(init: RequestInit | undefined): string {
  return typeof init?.body === "string" ? init.body : "";
}

function fakeFetch(route: Route): typeof fetch {
  recordedCalls.length = 0;
  const impl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input : input.url,
    );
    recordedCalls.push({
      url: url.toString(),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: requestBody(init),
    });
    return route(url, init);
  };
  return impl;
}

function apiRoute(overrides: Partial<Record<string, Route>> = {}): Route {
  return (url, init) => {
    const path = url.pathname;
    const override = overrides[path];
    if (override) {
      return override(url, init);
    }
    if (path === "/auth") {
      const body = JSON.parse(requestBody(init)) as { clientSecret: string };
      return body.clientSecret === "wrong"
        ? json({ message: "nope" }, 401)
        : json({ apiKey: "jwt" });
    }
    if (path === `/items/${FAKE_ITEM_BANCO_FIXTURE}`) {
      return json(FAKE_ITEMS[FAKE_ITEM_BANCO_FIXTURE]);
    }
    if (path.startsWith("/items/")) {
      return json({ message: "not found" }, 404);
    }
    if (path === "/accounts") {
      return json({
        results: FAKE_ACCOUNTS[url.searchParams.get("itemId") ?? ""] ?? [],
        page: 1,
        totalPages: 1,
      });
    }
    if (path === "/investments") {
      return json({
        results: FAKE_INVESTMENTS[url.searchParams.get("itemId") ?? ""] ?? [],
        page: 1,
        totalPages: 1,
      });
    }
    if (path === "/v2/transactions") {
      return json({
        results: FAKE_TRANSACTIONS[url.searchParams.get("accountId") ?? ""] ?? [],
        next: null,
      });
    }
    return json({ message: "unexpected" }, 500);
  };
}

async function authenticatedClient(fetchImpl: typeof fetch) {
  const provider = createPluggyProvider(hasher, { fetchImpl });
  const outcome = await provider.authenticate(credentials);
  if (outcome.status !== "ok") {
    throw new Error(`expected ok, got ${outcome.status}`);
  }
  return outcome.client;
}

describe("createPluggyProvider", () => {
  it("exchanges the credentials for an api key and sends it on every call", async () => {
    const client = await authenticatedClient(fakeFetch(apiRoute()));
    await client.listAccounts(FAKE_ITEM_BANCO_FIXTURE);

    const [authCall, accountsCall] = recordedCalls;
    expect(authCall?.url).toBe("https://api.pluggy.ai/auth");
    expect(JSON.parse(authCall?.body ?? "")).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
      nonExpiring: false,
    });
    expect(accountsCall?.url).toContain(`/accounts?itemId=${FAKE_ITEM_BANCO_FIXTURE}`);
    expect(accountsCall?.headers.get("X-API-KEY")).toBe("jwt");
  });

  it("reports invalid credentials on a 401 from auth", async () => {
    const provider = createPluggyProvider(hasher, { fetchImpl: fakeFetch(apiRoute()) });
    await expect(provider.authenticate({ ...credentials, clientSecret: "wrong" })).resolves.toEqual(
      {
        status: "invalid_credentials",
      },
    );
  });

  it("raises ProviderUnavailableError when auth fails for another reason or the network is down", async () => {
    const provider = createPluggyProvider(hasher, {
      fetchImpl: fakeFetch(apiRoute({ "/auth": () => json({ message: "down" }, 503) })),
    });
    await expect(provider.authenticate(credentials)).rejects.toThrow(ProviderUnavailableError);

    const offline = createPluggyProvider(hasher, {
      fetchImpl: fakeFetch(() => Promise.reject(new TypeError("fetch failed"))),
    });
    await expect(offline.authenticate(credentials)).rejects.toThrow(ProviderUnavailableError);
  });

  it("describes an item and reports not_found for an unknown one", async () => {
    const client = await authenticatedClient(fakeFetch(apiRoute()));
    await expect(client.describeConnection(FAKE_ITEM_BANCO_FIXTURE)).resolves.toEqual({
      status: "ok",
      connection: {
        providerItemId: FAKE_ITEM_BANCO_FIXTURE,
        institutionName: "Banco Fixture",
        institutionProviderId: "601",
        lastUpdatedAt: new Date("2026-09-18T09:10:00.000Z"),
      },
    });
    await expect(client.describeConnection("missing")).resolves.toEqual({ status: "not_found" });
  });

  it("normalizes accounts, investment positions and transactions", async () => {
    const client = await authenticatedClient(fakeFetch(apiRoute()));
    const accounts = await client.listAccounts(FAKE_ITEM_BANCO_FIXTURE);
    expect(accounts.map((account) => account.type)).toEqual([
      "checking",
      "savings",
      "credit_card",
      "checking",
    ]);
    const positions = await client.listInvestmentPositions(FAKE_ITEM_BANCO_FIXTURE);
    expect(positions.map((position) => position.productType)).toEqual(["CDB", "LCI"]);
    const transactions = await client.listTransactionsSince(
      "a1000000-0000-4000-8000-000000000001",
      "2026-09-01",
    );
    expect(transactions).toHaveLength(3);
  });

  it("walks every page of a paged listing", async () => {
    const fixtures = FAKE_INVESTMENTS[FAKE_ITEM_BANCO_FIXTURE] ?? [];
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/investments": (url) => {
            const page = Number(url.searchParams.get("page"));
            return json({ results: [fixtures[page - 1]], page, totalPages: 2 });
          },
        }),
      ),
    );
    const positions = await client.listInvestmentPositions(FAKE_ITEM_BANCO_FIXTURE);
    expect(positions.map((position) => position.name)).toEqual(fixtures.map((f) => f.name));
  });

  it("follows the cursor to the end of a transactions listing", async () => {
    const fixtures = FAKE_TRANSACTIONS[CHECKING_ACCOUNT_FIXTURE] ?? [];
    const cursor = "2026-09-01T00:00:00.000Z";
    const seen: (string | null)[] = [];
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": (url) => {
            const after = url.searchParams.get("after");
            seen.push(after);
            return after === null
              ? json({
                  results: [fixtures[0]],
                  next: `?accountId=x&after=${encodeURIComponent(cursor)}`,
                })
              : json({ results: fixtures.slice(1), next: null });
          },
        }),
      ),
    );
    const transactions = await client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01");
    expect(transactions.map((transaction) => transaction.providerTransactionId)).toEqual(
      fixtures.map((fixture) => fixture.id),
    );
    expect(seen).toEqual([null, cursor]);
  });

  it("asks for transactions by date, never through the retired paged endpoint", async () => {
    const client = await authenticatedClient(fakeFetch(apiRoute()));
    await client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01");
    const call = recordedCalls.find((recorded) => recorded.url.includes("transactions"));
    const asked = new URL(call?.url ?? "https://example.invalid");
    expect(asked.pathname).toBe("/v2/transactions");
    expect(asked.searchParams.get("dateFrom")).toBe("2026-09-01");
  });

  it("stops walking a transactions listing when the cursor is absent", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () => json({ results: [] }),
        }),
      ),
    );
    await expect(
      client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01"),
    ).resolves.toEqual([]);
  });

  it("refuses an empty cursor rather than reading it as the end of a listing", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () => json({ results: [], next: "" }),
        }),
      ),
    );
    await expect(
      client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01"),
    ).rejects.toThrow(ProviderResponseShapeError);
  });

  it("names the fields that did not match, collapsing an array index", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () =>
            json({
              results: [
                { id: "a", accountId: "b", date: "2026-09-01", description: "x", amount: 1 },
                { id: "c", accountId: "d", date: "2026-09-02", description: "y", amount: 2 },
              ],
              next: null,
            }),
        }),
      ),
    );
    const thrown: unknown = await client
      .listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01")
      .catch((error: unknown) => error);
    expect(thrown).toBeInstanceOf(ProviderResponseShapeError);
    if (!(thrown instanceof ProviderResponseShapeError)) {
      throw thrown;
    }
    expect(thrown.fields).toContain("results.#.type:invalid_value");
  });

  it("reports a failed transactions read as the collection, not the API version", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () => json({ results: [], next: "?page=2" }),
        }),
      ),
    );
    // The sync log keeps only what precedes the first slash, because the rest
    // of a provider path is an item id. A versioned path would log the version.
    await expect(
      client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01"),
    ).rejects.toMatchObject({ endpoint: "transactions" });
  });

  it("raises ProviderResponseShapeError when a cursor carries no after value", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () => json({ results: [], next: "?page=2" }),
        }),
      ),
    );
    await expect(
      client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01"),
    ).rejects.toThrow(ProviderResponseShapeError);
  });

  it("raises ProviderResponseShapeError rather than truncating an endless listing", async () => {
    let cursor = 0;
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () => {
            cursor += 1;
            return json({ results: [], next: `?after=${String(cursor)}` });
          },
        }),
      ),
    );
    await expect(
      client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01"),
    ).rejects.toThrow(ProviderResponseShapeError);
  });

  it("raises ProviderResponseShapeError when a cursor does not move", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/v2/transactions": () => json({ results: [], next: "?after=stuck" }),
        }),
      ),
    );
    await expect(
      client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01"),
    ).rejects.toThrow(ProviderResponseShapeError);
  });

  it("raises ProviderResponseShapeError when the server echoes the same page", async () => {
    const fixtures = FAKE_INVESTMENTS[FAKE_ITEM_BANCO_FIXTURE] ?? [];
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/investments": () => json({ results: fixtures, page: 1, totalPages: 2 }),
        }),
      ),
    );
    await expect(client.listInvestmentPositions(FAKE_ITEM_BANCO_FIXTURE)).rejects.toThrow(
      ProviderResponseShapeError,
    );
  });

  it("skips an account with an unknown subtype and keeps the rest", async () => {
    const fixtures = FAKE_ACCOUNTS[FAKE_ITEM_BANCO_FIXTURE] ?? [];
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/accounts": () =>
            json({
              results: [{ ...fixtures[0], subtype: "PREPAID_CARD" }, fixtures[1]],
              page: 1,
              totalPages: 1,
            }),
        }),
      ),
    );
    const accounts = await client.listAccounts(FAKE_ITEM_BANCO_FIXTURE);
    expect(accounts.map((account) => account.type)).toEqual(["savings"]);
  });

  it("drops fully withdrawn positions", async () => {
    const fixtures = FAKE_INVESTMENTS[FAKE_ITEM_BANCO_FIXTURE] ?? [];
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({
          "/investments": () =>
            json({
              results: [{ ...fixtures[0], status: "TOTAL_WITHDRAWAL" }, fixtures[1]],
              page: 1,
              totalPages: 1,
            }),
        }),
      ),
    );
    const positions = await client.listInvestmentPositions(FAKE_ITEM_BANCO_FIXTURE);
    expect(positions.map((position) => position.productType)).toEqual(["LCI"]);
  });

  it("raises ProviderResponseShapeError on a payload it does not understand", async () => {
    const client = await authenticatedClient(
      fakeFetch(
        apiRoute({ "/accounts": () => json({ results: [{ id: 1 }], page: 1, totalPages: 1 }) }),
      ),
    );
    await expect(client.listAccounts(FAKE_ITEM_BANCO_FIXTURE)).rejects.toThrow(
      ProviderResponseShapeError,
    );
  });

  it("raises ProviderUnavailableError on a 5xx from a listing", async () => {
    const client = await authenticatedClient(
      fakeFetch(apiRoute({ "/accounts": () => json({ message: "down" }, 502) })),
    );
    await expect(client.listAccounts(FAKE_ITEM_BANCO_FIXTURE)).rejects.toThrow(
      ProviderUnavailableError,
    );
  });

  // Pluggy rejects a manual update of a Meu Pluggy proxy item with a 400: the
  // original item is refreshed by Meu Pluggy every 24 hours and the proxy has
  // no auto-sync of its own, so every write to it would need the user's MFA.
  it("only ever reads from the provider, never writes", async () => {
    const client = await authenticatedClient(fakeFetch(apiRoute()));
    await client.describeConnection(FAKE_ITEM_BANCO_FIXTURE);
    await client.listAccounts(FAKE_ITEM_BANCO_FIXTURE);
    await client.listInvestmentPositions(FAKE_ITEM_BANCO_FIXTURE);
    await client.listTransactionsSince(CHECKING_ACCOUNT_FIXTURE, "2026-09-01");
    const afterAuth = recordedCalls.filter((call) => !call.url.endsWith("/auth"));
    expect(afterAuth.map((call) => call.method)).toEqual(afterAuth.map(() => "GET"));
  });
});
