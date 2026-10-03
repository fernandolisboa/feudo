import { describe, expect, it, vi } from "vitest";

import { TERMS_VERSION } from "@/modules/auth";
import type { HouseholdSession } from "@/modules/households";

import { EXPORT_RATE_LIMIT, handleExportRequest, type ExportRequestDeps } from "./export-request";
import type { ExportDocument } from "./export";

const SESSION: HouseholdSession = {
  userId: "user-1",
  name: "Ana",
  email: "ana@example.com",
  householdId: "household-1",
  theme: "caderno",
  termsVersion: TERMS_VERSION,
};

const EXPORTED_AT = new Date("2026-10-03T12:00:00Z");

const EMPTY_DOCUMENT: ExportDocument = {
  formatVersion: 1,
  exportedAt: EXPORTED_AT.toISOString(),
  user: {
    id: SESSION.userId,
    name: SESSION.name,
    email: SESSION.email,
    emailVerified: true,
    createdAt: EXPORTED_AT.toISOString(),
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: EXPORTED_AT.toISOString(),
    theme: "caderno",
  },
  households: [],
  providerCredentials: [],
  bankConnectionConsents: [],
  bankConnections: [],
  accounts: [],
  transactions: [],
  annotations: {
    categorizations: [],
    internalTransferMarks: [],
    categorizationRules: [],
    reserveMarks: [],
  },
  financialDataAccess: [],
};

function deps(overrides: Partial<ExportRequestDeps> = {}): Partial<ExportRequestDeps> {
  return {
    getSession: vi.fn().mockResolvedValue(SESSION),
    now: () => EXPORTED_AT,
    countRecentExports: vi.fn().mockResolvedValue(0),
    buildExportDocument: vi.fn().mockResolvedValue(EMPTY_DOCUMENT),
    recordExportAccess: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://feudo.example/api/export", { method: "POST", headers });
}

describe("handleExportRequest", () => {
  it("refuses a cross-site request before touching the session or the database", async () => {
    const getSession = vi.fn();
    const response = await handleExportRequest(
      request({ "sec-fetch-site": "cross-site" }),
      deps({ getSession }),
    );

    expect(response.status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
  });

  it.each(["same-origin", "none"])("allows a %s request through", async (site) => {
    const response = await handleExportRequest(request({ "sec-fetch-site": site }), deps());
    expect(response.status).toBe(200);
  });

  it("allows a request with no Sec-Fetch-Site header at all", async () => {
    const response = await handleExportRequest(request(), deps());
    expect(response.status).toBe(200);
  });

  it("redirects with 303 once the user has reached the rate limit, reading nothing", async () => {
    const buildExportDocument = vi.fn();
    const recordExportAccess = vi.fn();
    const response = await handleExportRequest(
      request(),
      deps({
        countRecentExports: vi.fn().mockResolvedValue(EXPORT_RATE_LIMIT),
        buildExportDocument,
        recordExportAccess,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "https://feudo.example/preferencias?exportacao=limite",
    );
    expect(buildExportDocument).not.toHaveBeenCalled();
    expect(recordExportAccess).not.toHaveBeenCalled();
  });

  it("returns the document as a downloadable, never-cached JSON file", async () => {
    const response = await handleExportRequest(request(), deps());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="feudo-meus-dados-2026-10-03.json"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.parse(await response.text())).toEqual(EMPTY_DOCUMENT);
  });

  it("records the export access after building the document and before responding", async () => {
    const calls: string[] = [];
    const response = await handleExportRequest(
      request(),
      deps({
        buildExportDocument: vi.fn().mockImplementation(() => {
          calls.push("build");
          return Promise.resolve(EMPTY_DOCUMENT);
        }),
        recordExportAccess: vi.fn().mockImplementation(() => {
          calls.push("record");
          return Promise.resolve();
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(calls).toEqual(["build", "record"]);
  });

  it("fails the request and serves no file when the audit write fails", async () => {
    const recordExportAccess = vi.fn().mockRejectedValue(new Error("audit write failed"));

    await expect(handleExportRequest(request(), deps({ recordExportAccess }))).rejects.toThrow(
      "audit write failed",
    );
  });
});
