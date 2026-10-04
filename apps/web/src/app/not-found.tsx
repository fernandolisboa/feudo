import { AuthShell } from "@/modules/auth";
import { NotFoundView, t } from "@/modules/shell";

export default function NotFound() {
  return (
    <AuthShell title={t.notFound.title}>
      <NotFoundView />
    </AuthShell>
  );
}
