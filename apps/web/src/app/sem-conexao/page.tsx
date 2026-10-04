import { AuthShell } from "@/modules/auth";
import { OfflineFallbackView, t } from "@/modules/shell";

export default function OfflineFallbackPage() {
  return (
    <AuthShell title={t.offline.fallbackTitle}>
      <OfflineFallbackView />
    </AuthShell>
  );
}
