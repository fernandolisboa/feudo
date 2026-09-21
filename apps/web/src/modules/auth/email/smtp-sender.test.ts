import { describe, expect, it, vi } from "vitest";

const sendMailMock = vi.fn();
const closeMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock, close: closeMock }));

vi.mock("nodemailer", () => ({
  createTransport: createTransportMock,
}));

const { InvalidSmtpPortError, MissingSmtpSettingError, SmtpEmailSender } =
  await import("./smtp-sender");
const { EmailSendError, EmailSendTimeoutError, MissingEmailFromError } = await import("./sender");

const ENV = {
  SMTP_HOST: "smtp.example.com",
  SMTP_USER: "feudo@example.com",
  SMTP_PASSWORD: "app-password",
  EMAIL_FROM: "Feudo <feudo@example.com>",
};
const INPUT = { to: "user@example.com", subject: "Subject", text: "text", html: "<p>html</p>" };

function resetMocks(): void {
  sendMailMock.mockReset();
  closeMock.mockReset();
  createTransportMock.mockClear();
}

describe("SmtpEmailSender", () => {
  it.each(["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"] as const)(
    "throws MissingSmtpSettingError naming %s when it is unset",
    (variable) => {
      const env = { ...ENV, [variable]: "" };
      expect(() => new SmtpEmailSender(env)).toThrow(MissingSmtpSettingError);
      expect(() => new SmtpEmailSender(env)).toThrow(variable);
    },
  );

  it("treats a whitespace-only setting as unset and trims the others", async () => {
    expect(() => new SmtpEmailSender({ ...ENV, SMTP_HOST: "   " })).toThrow(
      MissingSmtpSettingError,
    );
    resetMocks();
    sendMailMock.mockResolvedValueOnce({ messageId: "<0@example.com>" });

    await new SmtpEmailSender({ ...ENV, SMTP_HOST: " smtp.example.com " }).send(INPUT);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.example.com" }),
    );
  });

  it("throws MissingEmailFromError when EMAIL_FROM is unset", () => {
    expect(() => new SmtpEmailSender({ ...ENV, EMAIL_FROM: undefined })).toThrow(
      MissingEmailFromError,
    );
  });

  it.each(["0", "70000", "abc", "587.5"])(
    "throws InvalidSmtpPortError for SMTP_PORT=%s",
    (port) => {
      expect(() => new SmtpEmailSender({ ...ENV, SMTP_PORT: port })).toThrow(InvalidSmtpPortError);
    },
  );

  it("defaults to port 465 over implicit TLS and sends the message as given", async () => {
    resetMocks();
    sendMailMock.mockResolvedValueOnce({ messageId: "<1@example.com>" });
    const sender = new SmtpEmailSender(ENV);

    await expect(sender.send(INPUT)).resolves.toBeUndefined();

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: ENV.SMTP_HOST,
        port: 465,
        secure: true,
        auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASSWORD },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith({
      from: ENV.EMAIL_FROM,
      to: INPUT.to,
      subject: INPUT.subject,
      text: INPUT.text,
      html: INPUT.html,
    });
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("requires STARTTLS on any other port instead of ever sending credentials in clear", async () => {
    resetMocks();
    sendMailMock.mockResolvedValueOnce({ messageId: "<2@example.com>" });
    const sender = new SmtpEmailSender({ ...ENV, SMTP_PORT: "587" });

    await sender.send(INPUT);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false, requireTLS: true }),
    );
  });

  it("wraps a transport rejection in EmailSendError with only its structured fields, and still closes the transport", async () => {
    resetMocks();
    const rejection = Object.assign(
      new Error("Can't send mail - all recipients were rejected: 550 5.1.1 <user@example.com>"),
      { code: "EENVELOPE", responseCode: 550, command: "RCPT TO" },
    );
    sendMailMock.mockRejectedValue(rejection);
    const sender = new SmtpEmailSender(ENV);

    const error = await sender.send(INPUT).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmailSendError);
    expect((error as Error).message).toContain("EENVELOPE 550 RCPT TO");
    expect((error as Error).message).not.toContain("user@example.com");
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the error name when the rejection carries no structured fields", async () => {
    resetMocks();
    sendMailMock.mockRejectedValue(new TypeError("boom <user@example.com>"));
    const sender = new SmtpEmailSender(ENV);

    const error = await sender.send(INPUT).catch((caught: unknown) => caught);

    expect((error as Error).message).toContain("TypeError");
    expect((error as Error).message).not.toContain("user@example.com");
  });

  it("rejects a hung send with the transport's own timeout error, not the backstop race", async () => {
    resetMocks();
    sendMailMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(Object.assign(new Error("Greeting never received"), { code: "ETIMEDOUT" }));
          }, 10);
        }),
    );
    const sender = new SmtpEmailSender(ENV, 10);

    const error = await sender.send(INPUT).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmailSendError);
    expect((error as Error).message).toContain("ETIMEDOUT");
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("throws EmailSendTimeoutError as a backstop when the transport never settles at all", async () => {
    resetMocks();
    sendMailMock.mockImplementation(() => new Promise(() => {}));
    const sender = new SmtpEmailSender(ENV, 10);

    await expect(sender.send(INPUT)).rejects.toThrow(EmailSendTimeoutError);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
