"use server";

import { writeSidebarCollapsed } from "./sidebar-cookie";

export async function setSidebarCollapsedAction(collapsed: boolean): Promise<void> {
  await writeSidebarCollapsed(collapsed);
}
