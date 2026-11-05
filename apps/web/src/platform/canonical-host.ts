export interface CanonicalHostEnv {
  BETTER_AUTH_URL?: string;
  VERCEL_ENV?: string;
  [key: string]: string | undefined;
}

// Production answers on one origin, the one in BETTER_AUTH_URL: session
// cookies, Better Auth's trusted origin, the service worker and installed PWAs
// are all bound to it. Pages reached on any other production host (the former
// feudo.vercel.app, a deployment URL) are sent there. This is done here rather
// than with a Vercel domain redirect because Vercel Cron does not follow
// redirects, so /api must keep answering on every host.
export function canonicalRedirectUrl(
  requestUrl: URL,
  env: CanonicalHostEnv = process.env,
): URL | null {
  if (env.VERCEL_ENV !== "production" || !env.BETTER_AUTH_URL) {
    return null;
  }
  let canonical: URL;
  try {
    canonical = new URL(env.BETTER_AUTH_URL);
  } catch {
    return null;
  }
  if (requestUrl.host === canonical.host) {
    return null;
  }
  // Assigning the path to a fresh origin, never resolving it against one:
  // a path like "//evil.test" must stay a path, not become a new host.
  const target = new URL(canonical.origin);
  target.pathname = requestUrl.pathname;
  target.search = requestUrl.search;
  return target;
}
