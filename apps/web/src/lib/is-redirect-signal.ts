// Next.js implements redirect() as a thrown object with a "NEXT_REDIRECT"
// digest, not a normal return value. A server action called directly from a
// client component (bypassing useActionState/<form>) must rethrow it so
// Next's own boundary can still navigate, and must not mistake it for a
// real failure.
export function isRedirectSignal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}
