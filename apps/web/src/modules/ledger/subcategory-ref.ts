import { isProductSubcategoryId, type SubcategoryRef } from "@feudo/core";

const HOUSEHOLD_ID_PATTERN = /^[0-9a-f-]{36}$/;

export function encodeSubcategoryRef(ref: SubcategoryRef): string {
  return `${ref.type}:${ref.id}`;
}

export function decodeSubcategoryRef(value: string): SubcategoryRef | null {
  const separator = value.indexOf(":");
  if (separator < 0) {
    return null;
  }
  const type = value.slice(0, separator);
  const id = value.slice(separator + 1);
  if (type === "product" && isProductSubcategoryId(id)) {
    return { type, id };
  }
  if (type === "household" && HOUSEHOLD_ID_PATTERN.test(id)) {
    return { type, id };
  }
  return null;
}
