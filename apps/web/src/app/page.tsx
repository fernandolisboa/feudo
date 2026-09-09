import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signOutAction, getCurrentSession, t } from "@/modules/auth";

export default async function Home() {
  const session = await getCurrentSession();
  console.error("DEBUG-TEMP home: session", { hasSession: Boolean(session), name: session?.name });
  if (!session) {
    redirect("/entrar");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{t.overview.title}</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.overview.greeting.replace("{name}", session.name)}
      </h1>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          {t.overview.signOut}
        </Button>
      </form>
    </main>
  );
}
