import { eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { user } from "@/db/schema";

import type { ThemeName } from "./tokens";

export async function setUserTheme(db: Database, userId: string, theme: ThemeName): Promise<void> {
  await db.update(user).set({ theme }).where(eq(user.id, userId));
}
