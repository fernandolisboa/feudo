import { describe, expect, it } from "vitest";

import {
  addConnectionFormSchema,
  connectProviderFormSchema,
  relabelAccountFormSchema,
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
    });
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
