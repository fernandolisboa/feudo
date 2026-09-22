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
const FIXTURE_CHECKING_ACCOUNT = "a1000000-0000-4000-8000-000000000001";

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
      return init?.method === "PATCH"
        ? json(FAKE_ITEMS[FAKE_ITEM_BANCO_FIXTURE])
        : json(FAKE_ITEMS[FAKE_ITEM_BANCO_FIXTURE]);
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
    if (path === "/transactions") {
      return json({
        results: FAKE_TRANSACTIONS[url.searchParams.get("accountId") ?? ""] ?? [],
        page: 1,
        totalPages: 1,
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
    await client.listTransactionsSince(FIXTURE_CHECKING_ACCOUNT, "2026-09-01");
    const afterAuth = recordedCalls.filter((call) => !call.url.endsWith("/auth"));
    expect(afterAuth.map((call) => call.method)).toEqual(afterAuth.map(() => "GET"));
  });
});
