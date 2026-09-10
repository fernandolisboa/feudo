import { describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const {
  EmailSendError,
  EmailSendTimeoutError,
  MissingEmailFromError,
  MissingResendApiKeyError,
  ResendEmailSender,
} = await import("./resend-sender");

const ENV = { RESEND_API_KEY: "re_test_key", EMAIL_FROM: "no-reply@feudo.app" };
const INPUT = { to: "user@example.com", subject: "Subject", text: "text", html: "<p>html</p>" };

describe("ResendEmailSender", () => {
  it("throws MissingResendApiKeyError when RESEND_API_KEY is unset", () => {
    expect(() => new ResendEmailSender({ EMAIL_FROM: ENV.EMAIL_FROM })).toThrow(
      MissingResendApiKeyError,
    );
  });

  it("throws MissingEmailFromError when EMAIL_FROM is unset", () => {
    expect(() => new ResendEmailSender({ RESEND_API_KEY: ENV.RESEND_API_KEY })).toThrow(
      MissingEmailFromError,
    );
  });

  it("sends through Resend and resolves when there is no error", async () => {
    sendMock.mockReset().mockResolvedValueOnce({ data: { id: "email_1" }, error: null });
    const sender = new ResendEmailSender(ENV);

    await expect(sender.send(INPUT)).resolves.toBeUndefined();
    expect(sendMock).toHaveBeenCalledWith({
      from: ENV.EMAIL_FROM,
      to: INPUT.to,
      subject: INPUT.subject,
      text: INPUT.text,
      html: INPUT.html,
    });
  });

  it("throws EmailSendError when Resend reports an error", async () => {
    sendMock.mockReset().mockResolvedValueOnce({ data: null, error: { message: "invalid `to`" } });
    const sender = new ResendEmailSender(ENV);

    await expect(sender.send(INPUT)).rejects.toThrow(EmailSendError);
  });

  it("throws EmailSendTimeoutError instead of hanging when Resend never responds", async () => {
    sendMock.mockReset().mockImplementation(() => new Promise(() => {}));
    const sender = new ResendEmailSender(ENV, 10);

    await expect(sender.send(INPUT)).rejects.toThrow(EmailSendTimeoutError);
  });
});
