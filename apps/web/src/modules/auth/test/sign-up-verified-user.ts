import type { Database } from "@/platform/db/client";
import { findLastFakeSentEmail } from "../email/fake-email-repository";
import { getAuth } from "../auth";
import { signUp } from "../service";

export type SignUpVerifiedUserInput = { name: string; email: string; password: string };

function extractVerificationToken(emailText: string): string {
  const match = /https?:\/\/\S+/.exec(emailText);
  if (!match) {
    throw new Error("verification email did not contain a link");
  }
  const token = new URL(match[0]).searchParams.get("token");
  if (!token) {
    throw new Error("verification link did not contain a token");
  }
  return token;
}

// Other modules' integration tests need a signed-in user, not the sign-up
// flow itself (that is auth's own job to test) — this hands them a session's
// cookie headers in one call instead of each reimplementing sign-up, email
// verification and sign-in.
export async function signUpVerifiedUser(
  db: Database,
  input: SignUpVerifiedUserInput,
): Promise<Headers> {
  const outcome = await signUp({ ...input, termsAccepted: true }, new Headers());
  if (outcome.status !== "ok") {
    throw new Error(`sign-up failed: ${outcome.status}`);
  }

  const sentEmail = await findLastFakeSentEmail(db, input.email);
  if (!sentEmail) {
    throw new Error("no verification email was sent");
  }
  const token = extractVerificationToken(sentEmail.text);
  await getAuth().api.verifyEmail({ query: { token } });

  const response = await getAuth().api.signInEmail({
    body: { email: input.email, password: input.password },
    asResponse: true,
  });
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}
