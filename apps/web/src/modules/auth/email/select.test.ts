import { describe, expect, it } from "vitest";

import { getEmailSender } from "./select";
import { fakeEmailSender } from "./fake-sender";
import {
  MissingEmailFromError,
  MissingResendApiKeyError,
  ResendEmailSender,
} from "./resend-sender";

describe("getEmailSender", () => {
  it("returns the fake sender when EMAIL_PROVIDER is fake, without requiring Resend env vars", () => {
    expect(getEmailSender({ EMAIL_PROVIDER: "fake" })).toBe(fakeEmailSender);
  });

  it("builds a ResendEmailSender when RESEND_API_KEY and EMAIL_FROM are both set", () => {
    const sender = getEmailSender({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "no-reply@feudo.app",
    });
    expect(sender).toBeInstanceOf(ResendEmailSender);
  });

  it("throws MissingResendApiKeyError immediately when RESEND_API_KEY is missing", () => {
    expect(() =>
      getEmailSender({ EMAIL_PROVIDER: "resend", EMAIL_FROM: "no-reply@feudo.app" }),
    ).toThrow(MissingResendApiKeyError);
  });

  it("throws MissingEmailFromError immediately when EMAIL_FROM is missing", () => {
    expect(() =>
      getEmailSender({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test_key" }),
    ).toThrow(MissingEmailFromError);
  });

  it("throws before any email is sent, not lazily inside send()", () => {
    let sender: ResendEmailSender | undefined;
    expect(() => {
      sender = new ResendEmailSender({});
    }).toThrow(MissingResendApiKeyError);
    expect(sender).toBeUndefined();
  });
});
