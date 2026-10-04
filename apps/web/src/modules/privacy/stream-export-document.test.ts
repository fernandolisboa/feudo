import { describe, expect, it } from "vitest";

import type { ExportDocument } from "./export";
import { streamExportDocument } from "./stream-export-document";

const BASE_DOCUMENT: ExportDocument = {
  formatVersion: 1,
  exportedAt: "2026-10-03T12:00:00.000Z",
  user: {
    id: "user-1",
    name: "Ana",
    email: "ana@example.com",
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    termsVersion: "2026-10-03",
    termsAcceptedAt: "2026-01-01T00:00:00.000Z",
    theme: "caderno",
  },
  sessions: [
    {
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      expiresAt: "2026-02-01T00:00:00.000Z",
      ipAddress: "203.0.113.4",
      userAgent: "test-agent",
    },
  ],
  tours: {
    autoStart: true,
    items: [
      {
        tourId: "overview",
        tourVersion: 1,
        outcome: "completed",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  },
  households: [
    {
      householdId: "household-1",
      name: "Casa",
      role: "owner",
      joinedAt: "2026-01-01T00:00:00.000Z",
      deletionPending: false,
    },
  ],
  providerCredentials: [
    {
      provider: "pluggy",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastValidatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  bankConnectionConsents: [
    {
      id: "consent-1",
      scopeVersion: "v1",
      scopeText: "texto",
      acceptedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  bankConnections: [
    {
      id: "connection-1",
      provider: "pluggy",
      providerItemId: "item-1",
      institutionName: "Banco",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastSyncedAt: "2026-01-02T00:00:00.000Z",
      lastSyncAttemptedAt: "2026-01-02T00:00:00.000Z",
      lastSyncError: null,
      consentId: "consent-1",
    },
  ],
  accounts: [
    {
      id: "account-1",
      connectionId: "connection-1",
      householdId: "household-1",
      type: "checking",
      productType: null,
      name: "Conta",
      balanceCentavos: 12345,
      currency: "BRL",
      label: "individual",
      ratePpm: null,
      rateType: null,
      dueDate: null,
      acquisitionDate: null,
      syncedAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  transactions: [],
  annotations: {
    categorizations: [],
    internalTransferMarks: [],
    categorizationRules: [],
    reserveMarks: [],
  },
  financialDataAccess: [
    { householdId: "household-1", kind: "overview", accessedAt: "2026-01-02T00:00:00.000Z" },
  ],
  pushSubscriptions: [{ pushService: "fcm.googleapis.com", createdAt: "2026-01-02T00:00:00.000Z" }],
};

function transaction(id: string): ExportDocument["transactions"][number] {
  return {
    id,
    accountId: "account-1",
    date: "2026-01-02",
    occurredAt: null,
    amountCentavos: -500,
    currency: "BRL",
    description: `TRANSACTION ${id}`,
    providerCategory: null,
    type: "debit",
    counterpartType: null,
    syncedAt: "2026-01-02T00:00:00.000Z",
  };
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return result;
    }
    result += decoder.decode(value);
  }
}

describe("streamExportDocument", () => {
  it("parses back to the exact document when transactions is empty", async () => {
    const text = await readAll(streamExportDocument(BASE_DOCUMENT));
    expect(JSON.parse(text)).toEqual(BASE_DOCUMENT);
  });

  it("parses back to the exact document across several internal batches", async () => {
    const many: ExportDocument = {
      ...BASE_DOCUMENT,
      transactions: Array.from({ length: 1201 }, (_, index) => transaction(`t-${String(index)}`)),
    };
    const text = await readAll(streamExportDocument(many));
    expect(JSON.parse(text)).toEqual(many);
  });

  it("emits more than one chunk once the body is non-trivial", async () => {
    const many: ExportDocument = {
      ...BASE_DOCUMENT,
      transactions: Array.from({ length: 1201 }, (_, index) => transaction(`t-${String(index)}`)),
    };
    const reader = streamExportDocument(many).getReader();
    let chunkCount = 0;
    for (;;) {
      const { done } = await reader.read();
      if (done) {
        break;
      }
      chunkCount += 1;
    }
    expect(chunkCount).toBeGreaterThan(1);
  });
});
