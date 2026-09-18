import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { withTestDb } from "@/platform/db/test/harness";
import { recordFakeSentEmail } from "@/modules/auth/email/fake-email-repository";

import { GET } from "./route";

const TOKEN = "integration-test-only-token";
const URL_BASE = "http://localhost:3000/api/test-only/last-email";

function request(url: string, authorization?: string): Request {
  const headers = new Headers();
  if (authorization) {
    headers.set("authorization", authorization);
  }
  return new Request(url, { headers });
}

let originalVercelEnv: string | undefined;
let originalEmailProvider: string | undefined;
let originalTestOnlyToken: string | undefined;

beforeEach(() => {
  originalVercelEnv = process.env.VERCEL_ENV;
  originalEmailProvider = process.env.EMAIL_PROVIDER;
  originalTestOnlyToken = process.env.TEST_ONLY_TOKEN;
  process.env.EMAIL_PROVIDER = "fake";
  process.env.TEST_ONLY_TOKEN = TOKEN;
  delete process.env.VERCEL_ENV;
});

afterEach(() => {
  process.env.VERCEL_ENV = originalVercelEnv;
  process.env.EMAIL_PROVIDER = originalEmailProvider;
  process.env.TEST_ONLY_TOKEN = originalTestOnlyToken;
});

describe("GET /api/test-only/last-email", () => {
  it("404s when VERCEL_ENV is production, even with a valid token and EMAIL_PROVIDER=fake", async () => {
    process.env.VERCEL_ENV = "production";

    const response = await GET(request(`${URL_BASE}?to=someone@example.com`, `Bearer ${TOKEN}`));

    expect(response.status).toBe(404);
  });

  it("404s when EMAIL_PROVIDER is not fake", async () => {
    process.env.EMAIL_PROVIDER = "resend";

    const response = await GET(request(`${URL_BASE}?to=someone@example.com`, `Bearer ${TOKEN}`));

    expect(response.status).toBe(404);
  });

  it("401s when the bearer token is missing", async () => {
    const response = await GET(request(`${URL_BASE}?to=someone@example.com`));

    expect(response.status).toBe(401);
  });

  it("401s when the bearer token is wrong", async () => {
    const response = await GET(
      request(`${URL_BASE}?to=someone@example.com`, "Bearer not-the-token"),
    );

    expect(response.status).toBe(401);
  });

  it("404s when the request is authorized but has no `to` parameter", async () => {
    const response = await GET(request(URL_BASE, `Bearer ${TOKEN}`));

    expect(response.status).toBe(404);
  });

  it("404s when there is no email for the requested address", async () => {
    await withTestDb(async () => {
      const response = await GET(request(`${URL_BASE}?to=nobody@example.com`, `Bearer ${TOKEN}`));

      expect(response.status).toBe(404);
    });
  });

  it("returns the last email persisted for the requested address", async () => {
    await withTestDb(async (db) => {
      await recordFakeSentEmail(db, {
        to: "someone@example.com",
        subject: "First",
        text: "first text",
        html: "<p>first</p>",
      });
      await recordFakeSentEmail(db, {
        to: "someone@example.com",
        subject: "Second",
        text: "second text",
        html: "<p>second</p>",
      });

      const response = await GET(request(`${URL_BASE}?to=someone@example.com`, `Bearer ${TOKEN}`));

      expect(response.status).toBe(200);
      const body = (await response.json()) as { subject: string; text: string };
      expect(body.subject).toBe("Second");
      expect(body.text).toBe("second text");
    });
  });

  it("scopes the lookup to the requested address", async () => {
    await withTestDb(async (db) => {
      await recordFakeSentEmail(db, {
        to: "other@example.com",
        subject: "Not this one",
        text: "not this one",
        html: "<p>not this one</p>",
      });

      const response = await GET(request(`${URL_BASE}?to=someone@example.com`, `Bearer ${TOKEN}`));

      expect(response.status).toBe(404);
    });
  });
});
