import { beforeEach, describe, expect, it, vi } from "vitest";

const handlerMock = vi.fn();
const signOutMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("./auth", () => ({
  getAuth: () => ({
    handler: handlerMock,
    api: { signOut: signOutMock, getSession: getSessionMock },
  }),
}));

const { resendVerification, signIn, signOut, signUp } = await import("./service");

beforeEach(() => {
  handlerMock.mockReset();
  signOutMock.mockReset();
  getSessionMock.mockReset();
  getSessionMock.mockResolvedValue(null);
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

  it("signUp maps the hook's registration_closed response to registration_closed", async () => {
    handlerMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "registration_closed" }), { status: 403 }),
    );

    const outcome = await signUp(
      { name: "A", email: "a@example.com", password: "correct-horse", termsAccepted: true },
      new Headers(),
    );

    expect(outcome).toEqual({ status: "registration_closed" });
  });

  it("signUp maps the hook's terms_not_accepted response to terms_not_accepted", async () => {
    handlerMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "terms_not_accepted" }), { status: 400 }),
    );

    const outcome = await signUp(
      { name: "A", email: "a@example.com", password: "correct-horse", termsAccepted: true },
      new Headers(),
    );

    expect(outcome).toEqual({ status: "terms_not_accepted" });
  });

  it("signOut returns failed and logs only the error name when the handler rejects", async () => {
    handlerMock.mockRejectedValueOnce(new Error("boom"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const outcome = await signOut(new Headers());

    expect(outcome).toEqual({ status: "failed" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), "Error");
    consoleErrorSpy.mockRestore();
  });

  it("signOut returns failed when the handler responds with a non-ok status", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    const outcome = await signOut(new Headers());

    expect(outcome).toEqual({ status: "failed" });
  });

  it("signOut returns ok when the handler responds ok and no session resolves afterwards", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    getSessionMock.mockResolvedValueOnce(null);

    const outcome = await signOut(new Headers());

    expect(outcome).toEqual({ status: "ok" });
  });

  it("signOut returns failed when the handler responds ok but a session still resolves (deleteSession failed silently)", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    getSessionMock.mockResolvedValueOnce({
      session: { id: "s1" },
      user: { id: "u1" },
    });

    const outcome = await signOut(new Headers());

    expect(outcome).toEqual({ status: "failed" });
  });

  it("signOut returns failed when the post-sign-out session re-check rejects", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    getSessionMock.mockRejectedValueOnce(new Error("db unavailable"));

    const outcome = await signOut(new Headers());

    expect(outcome).toEqual({ status: "failed" });
  });

  it("signOut re-checks the session with disableRefresh so it cannot re-issue the cleared cookie", async () => {
    handlerMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    getSessionMock.mockResolvedValueOnce(null);
    const requestHeaders = new Headers();

    await signOut(requestHeaders);

    expect(getSessionMock).toHaveBeenCalledWith({
      headers: requestHeaders,
      query: { disableRefresh: true },
    });
  });
});
