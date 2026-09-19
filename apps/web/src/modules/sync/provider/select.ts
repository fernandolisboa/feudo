import { createDocumentHasher } from "../document-hash";
import { readDataProviderName, readDocumentHashKey, type SyncEnv } from "../env";
import { createFakeProvider } from "./fake-provider";
import { createPluggyProvider } from "./pluggy-provider";
import type { DataProvider } from "./provider";

export function getDataProvider(env: SyncEnv = process.env): DataProvider {
  const hasher = createDocumentHasher(readDocumentHashKey(env));
  return readDataProviderName(env) === "fake"
    ? createFakeProvider(hasher)
    : createPluggyProvider(hasher);
}
