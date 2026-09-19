import { createHmac } from "node:crypto";

export type DocumentHasher = (document: string) => string | null;

const DOCUMENT_DIGIT_LENGTHS = new Set([11, 14]);

// An unkeyed hash of an 11-digit CPF is reversible by enumeration, so the
// hash is an HMAC under a server-side secret (ADR-0008). Only the digits are
// hashed: providers format the same document with or without punctuation.
export function createDocumentHasher(documentHashKey: string): DocumentHasher {
  return (document) => {
    const digits = document.replace(/\D/g, "");
    if (!DOCUMENT_DIGIT_LENGTHS.has(digits.length)) {
      return null;
    }
    return createHmac("sha256", documentHashKey).update(digits).digest("hex");
  };
}
