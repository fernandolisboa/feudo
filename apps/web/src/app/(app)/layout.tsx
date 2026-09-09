import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { readSidebarCollapsed } from "@/components/app-shell/sidebar-cookie";
import { getCurrentSession } from "@/modules/auth";
import { resolveTheme, shellLayoutFor } from "@/modules/theme";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/entrar");
  }

  const shell = shellLayoutFor(resolveTheme(session.theme));
  const sidebarCollapsed = shell === "sidebar" ? await readSidebarCollapsed() : false;

  return (
    <AppShell
      shell={shell}
      sidebarCollapsed={sidebarCollapsed}
      userName={session.name}
      userEmail={session.email}
    >
      {children}
    </AppShell>
  );
}
