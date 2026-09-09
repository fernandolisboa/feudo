import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ResendVerificationForm } from "@/modules/auth/components/resend-verification-form";
import { authStrings } from "@/modules/auth/strings";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const t = authStrings.ptBR.verifyEmail;

  return (
    <AuthShell title={t.title}>
      <p className="text-sm">{t.body.replace("{email}", email ?? "")}</p>
      {email ? (
        <div className="mt-4">
          <ResendVerificationForm email={email} />
        </div>
      ) : null}
    </AuthShell>
  );
}
