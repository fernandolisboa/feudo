export function extractTokenFromEmail(emailText: string): string {
  const match = /https?:\/\/\S+/.exec(emailText);
  if (!match) {
    throw new Error("email did not contain a link");
  }
  const url = new URL(match[0]);
  // Better Auth puts the magic-link and email-verification tokens in a
  // `?token=` query param, but the password-reset link carries it as the
  // last path segment (`/reset-password/:token`); this covers both shapes.
  const fromQuery = url.searchParams.get("token");
  if (fromQuery) {
    return fromQuery;
  }
  const lastSegment = url.pathname.split("/").filter(Boolean).pop();
  if (!lastSegment) {
    throw new Error("link did not contain a token");
  }
  return lastSegment;
}
