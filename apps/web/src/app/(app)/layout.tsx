import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentSession } from "@/modules/auth";
import { resolveAppRoute } from "@/modules/households";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  const redirectTarget = resolveAppRoute(session);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return children;
}
