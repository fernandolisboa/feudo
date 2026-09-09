import { beforeEach, describe, expect, it, vi } from "vitest";

const handlerMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("./auth", () => ({
  getAuth: () => ({ handler: handlerMock, api: { signOut: signOutMock } }),
}));

const { resendVerification, signIn, signUp } = await import("./service");

beforeEach(() => {
  handlerMock.mockReset();
  signOutMock.mockReset();
  process.env.REGISTRATION_MODE = "open";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

describe("service boundary error handling", () => {
  it("signUp returns sign_up_failed and logs only the error name when the handler rejects with a non-Error value", async () => {
    handlerMock.mockRejectedValueOnce("boom");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const outcome = await signUp(
      { name: "A", email: "a@example.com", password: "correct-horse", termsAccepted: true },
      new Headers(),
    );

    expect(outcome).toEqual({ status: "sign_up_failed" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), "UnknownError");
    consoleErrorSpy.mockRestore();
  });

  it("signIn returns failed and logs only the error name when the handler rejects with an Error", async () => {
    handlerMock.mockRejectedValueOnce(new Error("boom"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const outcome = await signIn({ email: "a@example.com", password: "x" }, new Headers());

    expect(outcome).toEqual({ status: "failed" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), "Error");
    consoleErrorSpy.mockRestore();
  });

  it("resendVerification returns failed and logs only the error name when the handler rejects", async () => {
    handlerMock.mockRejectedValueOnce(new Error("boom"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const outcome = await resendVerification("a@example.com", new Headers());

    expect(outcome).toEqual({ status: "failed" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), "Error");
    consoleErrorSpy.mockRestore();
  });

  it("signUp maps a 429 response to rate_limited", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    const outcome = await signUp(
      { name: "A", email: "a@example.com", password: "correct-horse", termsAccepted: true },
      new Headers(),
    );

    expect(outcome).toEqual({ status: "rate_limited" });
  });

  it("signIn maps a 429 response to rate_limited", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    const outcome = await signIn({ email: "a@example.com", password: "x" }, new Headers());

    expect(outcome).toEqual({ status: "rate_limited" });
  });

  it("resendVerification maps a 429 response to rate_limited", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    const outcome = await resendVerification("a@example.com", new Headers());

    expect(outcome).toEqual({ status: "rate_limited" });
  });
});
