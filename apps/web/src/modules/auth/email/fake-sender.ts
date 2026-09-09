import type { EmailSender, SendEmailInput } from "./sender";

export type SentEmail = SendEmailInput & { sentAt: Date };

export class FakeEmailSender implements EmailSender {
  private messages: SentEmail[] = [];

  send(input: SendEmailInput): Promise<void> {
    this.messages.push({ ...input, sentAt: new Date() });
    return Promise.resolve();
  }

  list(): readonly SentEmail[] {
    return this.messages;
  }

  lastTo(to: string): SentEmail | undefined {
    return [...this.messages].reverse().find((message) => message.to === to);
  }

  last(): SentEmail | undefined {
    return this.messages.at(-1);
  }

  reset(): void {
    this.messages = [];
  }
}

declare global {
  var __feudoFakeEmailSender: FakeEmailSender | undefined;
}

// Next.js bundles server actions and route handlers into separate module
// graphs, so a plain module-level singleton is not the same instance across
// them; globalThis is the one thing every bundle shares within the process.
function getSharedFakeEmailSender(): FakeEmailSender {
  globalThis.__feudoFakeEmailSender ??= new FakeEmailSender();
  return globalThis.__feudoFakeEmailSender;
}

export const fakeEmailSender = getSharedFakeEmailSender();
