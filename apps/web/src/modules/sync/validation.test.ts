import { describe, expect, it } from "vitest";

import {
  addConnectionFormSchema,
  connectProviderFormSchema,
  relabelAccountFormSchema,
  renameConnectionFormSchema,
} from "./validation";

const ITEM_ID = "0F1E2D3C-4B5A-4A6B-8C7D-8E9F0A1B2C3D";

describe("connectProviderFormSchema", () => {
  it("trims the fields and lower-cases the item id", () => {
    const parsed = connectProviderFormSchema.parse({
      consentId: " consent ",
      clientId: " client ",
      clientSecret: " secret ",
      providerItemId: ` ${ITEM_ID} `,
    });
    expect(parsed).toEqual({
      consentId: "consent",
      clientId: "client",
      clientSecret: "secret",
      providerItemId: ITEM_ID.toLowerCase(),
      institutionName: undefined,
    });
  });

  it("trims an institution name and treats blank as absent", () => {
    const base = {
      consentId: "consent",
      clientId: "client",
      clientSecret: "secret",
      providerItemId: ITEM_ID,
    };
    expect(
      connectProviderFormSchema.parse({ ...base, institutionName: "  Itaú  " }).institutionName,
    ).toBe("Itaú");
    expect(
      connectProviderFormSchema.parse({ ...base, institutionName: "   " }).institutionName,
    ).toBeUndefined();
    expect(
      connectProviderFormSchema.parse({ ...base, institutionName: undefined }).institutionName,
    ).toBeUndefined();
    expect(
      connectProviderFormSchema.safeParse({ ...base, institutionName: "x".repeat(81) }).success,
    ).toBe(false);
  });

  it("rejects an item id that is not a uuid and empty credentials", () => {
    expect(
      connectProviderFormSchema.safeParse({
        consentId: "c",
        clientId: "client",
        clientSecret: "secret",
        providerItemId: "banco-fixture",
      }).success,
    ).toBe(false);
    expect(
      connectProviderFormSchema.safeParse({
        consentId: "c",
        clientId: "",
        clientSecret: "secret",
        providerItemId: ITEM_ID,
      }).success,
    ).toBe(false);
  });
});

describe("addConnectionFormSchema", () => {
  it("accepts a uuid item id only", () => {
    expect(addConnectionFormSchema.safeParse({ providerItemId: ITEM_ID }).success).toBe(true);
    expect(addConnectionFormSchema.safeParse({ providerItemId: "123" }).success).toBe(false);
  });

  it("trims an optional institution name and treats blank as absent", () => {
    expect(
      addConnectionFormSchema.parse({ providerItemId: ITEM_ID, institutionName: " Nubank " })
        .institutionName,
    ).toBe("Nubank");
    expect(
      addConnectionFormSchema.parse({ providerItemId: ITEM_ID, institutionName: "" })
        .institutionName,
    ).toBeUndefined();
  });
});

describe("renameConnectionFormSchema", () => {
  it("requires a connection id and a non-blank institution name up to 80 chars", () => {
    expect(
      renameConnectionFormSchema.safeParse({ connectionId: "c1", institutionName: "Itaú" }).success,
    ).toBe(true);
    expect(
      renameConnectionFormSchema.safeParse({ connectionId: "c1", institutionName: "  " }).success,
    ).toBe(false);
    expect(
      renameConnectionFormSchema.safeParse({ connectionId: "c1", institutionName: "" }).success,
    ).toBe(false);
    expect(
      renameConnectionFormSchema.safeParse({
        connectionId: "c1",
        institutionName: "x".repeat(81),
      }).success,
    ).toBe(false);
    expect(
      renameConnectionFormSchema.parse({ connectionId: "c1", institutionName: "  Itaú  " })
        .institutionName,
    ).toBe("Itaú");
  });
});

describe("relabelAccountFormSchema", () => {
  it("accepts only the two labels", () => {
    expect(relabelAccountFormSchema.safeParse({ accountId: "a", label: "shared" }).success).toBe(
      true,
    );
    expect(relabelAccountFormSchema.safeParse({ accountId: "a", label: "joint" }).success).toBe(
      false,
    );
  });
});
