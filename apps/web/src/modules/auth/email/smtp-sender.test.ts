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

  it("wraps a transport rejection in EmailSendError and still closes the transport", async () => {
    resetMocks();
    sendMailMock.mockRejectedValue(new Error("535 Authentication failed"));
    const sender = new SmtpEmailSender(ENV);

    await expect(sender.send(INPUT)).rejects.toThrow(EmailSendError);
    await expect(sender.send(INPUT)).rejects.toThrow("535 Authentication failed");
    expect(closeMock).toHaveBeenCalledTimes(2);
  });

  it("throws EmailSendTimeoutError instead of hanging when the server never answers", async () => {
    resetMocks();
    sendMailMock.mockImplementation(() => new Promise(() => {}));
    const sender = new SmtpEmailSender(ENV, 10);

    await expect(sender.send(INPUT)).rejects.toThrow(EmailSendTimeoutError);
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
