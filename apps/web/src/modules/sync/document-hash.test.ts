import { describe, expect, it } from "vitest";

import { createDocumentHasher } from "./document-hash";

const KEY = "unit-test-document-hash-key-with-32-chars!!";

describe("createDocumentHasher", () => {
  it("hashes the digits of a CPF regardless of punctuation", () => {
    const hash = createDocumentHasher(KEY);
    expect(hash("123.456.789-09")).toBe(hash("12345678909"));
    expect(hash("12345678909")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes a CNPJ too", () => {
    const hash = createDocumentHasher(KEY);
    expect(hash("12.345.678/0001-95")).toBe(hash("12345678000195"));
  });

  it("never emits the document itself", () => {
    const hash = createDocumentHasher(KEY);
    expect(hash("12345678909")).not.toContain("12345678909");
  });

  it("depends on the key", () => {
    expect(createDocumentHasher(KEY)("12345678909")).not.toBe(
      createDocumentHasher("a-different-document-hash-key-with-32-chars")("12345678909"),
    );
  });

  it("returns null for anything that is not an 11- or 14-digit document", () => {
    const hash = createDocumentHasher(KEY);
    expect(hash("")).toBeNull();
    expect(hash("1234")).toBeNull();
    expect(hash("***.456.789-**")).toBeNull();
  });
});
