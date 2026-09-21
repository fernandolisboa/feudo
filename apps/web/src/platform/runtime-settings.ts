import { createClient, parseConnectionString } from "@vercel/global-config";

export interface RuntimeSettings {
  read(key: string): Promise<unknown>;
}

interface RuntimeSettingsEnv {
  GLOBAL_CONFIG?: string;
  [key: string]: string | undefined;
}

export class InvalidGlobalConfigConnectionError extends Error {
  constructor() {
    super("GLOBAL_CONFIG is not a valid Global Config connection string");
    this.name = "InvalidGlobalConfigConnectionError";
  }
}

const noStore: RuntimeSettings = {
  read: () => Promise.resolve(undefined),
};

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

export function createRuntimeSettings(env: RuntimeSettingsEnv = process.env): RuntimeSettings {
  const connectionString = env.GLOBAL_CONFIG;
  if (!connectionString) {
    return noStore;
  }
  if (!parseConnectionString(connectionString)) {
    throw new InvalidGlobalConfigConnectionError();
  }
  const client = createClient(connectionString);
  return {
    async read(key) {
      try {
        return await client.get(key);
      } catch (error) {
        console.error("Global Config read failed", { key, name: errorName(error) });
        return undefined;
      }
    },
  };
}
