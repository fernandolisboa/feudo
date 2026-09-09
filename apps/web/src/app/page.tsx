import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/modules/auth/actions";
import { getCurrentSession } from "@/modules/auth/session";
import { authStrings } from "@/modules/auth/strings";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/entrar");
  }

  const t = authStrings.ptBR.overview;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{t.title}</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.greeting.replace("{name}", session.user.name)}
      </h1>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          {t.signOut}
        </Button>
      </form>
    </main>
  );
}
