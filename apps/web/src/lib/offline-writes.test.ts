// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionState } from "./action-state";
import { blockWriteWhenOffline, refuseWhenOffline, WRITE_BLOCKED_EVENT } from "./offline-writes";

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function setOnline(online: boolean): void {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });
}

afterEach(() => {
  Reflect.deleteProperty(window.navigator, "onLine");
});

describe("blockWriteWhenOffline", () => {
  it("lets a write through while online, without announcing anything", () => {
    setOnline(true);
    const listener = vi.fn();
    window.addEventListener(WRITE_BLOCKED_EVENT, listener);

    expect(blockWriteWhenOffline()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(WRITE_BLOCKED_EVENT, listener);
  });

  it("refuses a write while offline and announces it for the app shell", () => {
    setOnline(false);
    const listener = vi.fn();
    window.addEventListener(WRITE_BLOCKED_EVENT, listener);

    expect(blockWriteWhenOffline()).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(WRITE_BLOCKED_EVENT, listener);
  });
});

describe("refuseWhenOffline", () => {
  it("offline, answers with the message and never calls the action", async () => {
    setOnline(false);
    const action = vi.fn<FormAction>(() => Promise.resolve({ status: "idle" }));

    const result = await refuseWhenOffline(action, "sem conexão")(
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({ status: "error", message: "sem conexão" });
    expect(action).not.toHaveBeenCalled();
  });

  it("online, passes the arguments to the action and returns its state", async () => {
    setOnline(true);
    const formData = new FormData();
    const action = vi.fn<FormAction>(() => Promise.resolve({ status: "success", message: "ok" }));

    const result = await refuseWhenOffline(action, "sem conexão")({ status: "idle" }, formData);

    expect(result).toEqual({ status: "success", message: "ok" });
    expect(action).toHaveBeenCalledWith({ status: "idle" }, formData);
  });
});
