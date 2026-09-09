import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { fakeSentEmails } from "@/db/schema/fake-sent-emails";
import type { SendEmailInput } from "./sender";

export async function recordFakeSentEmail(db: Database, input: SendEmailInput): Promise<void> {
  await db.insert(fakeSentEmails).values(input);
}

export type FakeSentEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  sentAt: Date;
};

export async function findLastFakeSentEmail(
  db: Database,
  to: string,
): Promise<FakeSentEmail | undefined> {
  const [row] = await db
    .select()
    .from(fakeSentEmails)
    .where(eq(fakeSentEmails.to, to))
    .orderBy(desc(fakeSentEmails.sentAt))
    .limit(1);
  return row;
}
