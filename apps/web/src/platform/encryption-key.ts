export interface EncryptionKeyEnv {
  ENCRYPTION_KEY?: string;
  [key: string]: string | undefined;
}

// 32 characters is the floor for a key pasted from a password manager's
// generator; the actual AES key is derived from it (platform/crypto.ts).
export const MIN_ENCRYPTION_KEY_LENGTH = 32;

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      `ENCRYPTION_KEY is not set or is shorter than ${String(MIN_ENCRYPTION_KEY_LENGTH)} characters.`,
    );
    this.name = "MissingEncryptionKeyError";
  }
}

// The one place that reads and validates ENCRYPTION_KEY: sync (Meu Pluggy
// credentials) and analysis (the household's Anthropic key) both decrypt
// secrets with it, and both must agree on what counts as present. Checks
// and returns the exact same raw string (sync's own rule before this moved
// here): an empty string is missing, same as unset, but anything else is
// read as given, never trimmed — trimming here would change the AES key
// platform/crypto.ts derives from it (and so keyIdFor) for a value that
// still worked yesterday.
export function readEncryptionKey(env: EncryptionKeyEnv = process.env): string {
  const raw = env.ENCRYPTION_KEY;
  if (raw === undefined || raw === "" || raw.length < MIN_ENCRYPTION_KEY_LENGTH) {
    throw new MissingEncryptionKeyError();
  }
  return raw;
}

export function hasValidEncryptionKey(env: EncryptionKeyEnv = process.env): boolean {
  try {
    readEncryptionKey(env);
    return true;
  } catch {
    return false;
  }
}
