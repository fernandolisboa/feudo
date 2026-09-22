export interface DatabaseHostEnv {
  DATABASE_URL?: string;
  DATABASE_RESET_ALLOWED_HOST?: string;
  DATABASE_PRODUCTION_HOST?: string;
  [key: string]: string | undefined;
}

export interface DatabaseHostOptions {
  allowProduction?: boolean;
}

export type DatabaseHostCheck = { ok: true } | { ok: false; reason: string };

export function databaseHost(host: string): string {
  const withoutTrailingDot = host.toLowerCase().replace(/\.$/, "");
  const [firstLabel = "", ...rest] = withoutTrailingDot.split(".");
  const withoutPoolerSuffix = firstLabel.replace(/-pooler$/, "");
  return [withoutPoolerSuffix, ...rest].join(".");
}

export function checkDatabaseHost(
  env: DatabaseHostEnv,
  { allowProduction = false }: DatabaseHostOptions = {},
): DatabaseHostCheck {
  let targetHost: string;
  try {
    targetHost = databaseHost(new URL(env.DATABASE_URL ?? "").hostname);
  } catch {
    return { ok: false, reason: "DATABASE_URL is not a valid URL" };
  }

  if (env.DATABASE_PRODUCTION_HOST && targetHost === databaseHost(env.DATABASE_PRODUCTION_HOST)) {
    return allowProduction
      ? { ok: true }
      : { ok: false, reason: "DATABASE_URL's host matches DATABASE_PRODUCTION_HOST" };
  }

  if (!env.DATABASE_RESET_ALLOWED_HOST) {
    return {
      ok: false,
      reason: allowProduction
        ? "DATABASE_PRODUCTION_HOST does not match DATABASE_URL's host and DATABASE_RESET_ALLOWED_HOST is not set"
        : "DATABASE_RESET_ALLOWED_HOST is not set",
    };
  }

  if (targetHost !== databaseHost(env.DATABASE_RESET_ALLOWED_HOST)) {
    return { ok: false, reason: "DATABASE_RESET_ALLOWED_HOST does not match DATABASE_URL's host" };
  }

  return { ok: true };
}
