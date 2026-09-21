import { describe, expect, it } from "vitest";

import { getEmailSender } from "./select";
import { fakeEmailSender } from "./fake-sender";
import { MissingResendApiKeyError, ResendEmailSender } from "./resend-sender";
import { MissingEmailFromError } from "./sender";
import { MissingSmtpSettingError, SmtpEmailSender } from "./smtp-sender";

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

  it("builds an SmtpEmailSender when EMAIL_PROVIDER is smtp and its settings are set", () => {
    const sender = getEmailSender({
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_USER: "feudo@example.com",
      SMTP_PASSWORD: "app-password",
      EMAIL_FROM: "no-reply@feudo.app",
    });
    expect(sender).toBeInstanceOf(SmtpEmailSender);
  });

  it("throws MissingSmtpSettingError immediately when an SMTP setting is missing", () => {
    expect(() =>
      getEmailSender({ EMAIL_PROVIDER: "smtp", EMAIL_FROM: "no-reply@feudo.app" }),
    ).toThrow(MissingSmtpSettingError);
  });

  it("throws before any email is sent, not lazily inside send()", () => {
    let sender: ResendEmailSender | undefined;
    expect(() => {
      sender = new ResendEmailSender({});
    }).toThrow(MissingResendApiKeyError);
    expect(sender).toBeUndefined();
  });
});
