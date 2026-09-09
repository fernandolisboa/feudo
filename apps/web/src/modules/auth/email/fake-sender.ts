import { getDb } from "@/db/client";
import { recordFakeSentEmail } from "./fake-email-repository";
import type { EmailSender, SendEmailInput } from "./sender";

// Vercel functions are separate processes, so an in-memory store would not
// survive between the request that sends the email and the one that reads it
// back through the test-only route; persisting to the database does.
class FakeEmailSender implements EmailSender {
  async send(input: SendEmailInput): Promise<void> {
    await recordFakeSentEmail(getDb(), input);
  }
}

export const fakeEmailSender: EmailSender = new FakeEmailSender();
