// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { blockWriteWhenOffline, WRITE_BLOCKED_EVENT } from "./offline-writes";

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
