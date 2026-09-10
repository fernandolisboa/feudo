import { afterEach, describe, expect, it, vi } from "vitest";

const waitUntilMock = vi.fn();

vi.mock("@vercel/functions", () => ({
  waitUntil: waitUntilMock,
}));

const { scheduleBackgroundTask } = await import("./background-tasks");

describe("scheduleBackgroundTask", () => {
  afterEach(() => {
    waitUntilMock.mockReset();
  });

  it("passes the task straight through to @vercel/functions' waitUntil", () => {
    const task = Promise.resolve("done");

    scheduleBackgroundTask(task);

    expect(waitUntilMock).toHaveBeenCalledWith(task);
  });

  it("lets the task keep running to completion outside a Vercel request context", async () => {
    let settled = false;
    const task = Promise.resolve().then(() => {
      settled = true;
    });

    scheduleBackgroundTask(task);
    await task;

    expect(settled).toBe(true);
  });

  it("falls back to task.catch instead of throwing when waitUntil itself throws", async () => {
    waitUntilMock.mockImplementation(() => {
      throw new Error("waitUntil unavailable");
    });
    let settled = false;
    const task = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("task failed"));
      }, 0);
    }).finally(() => {
      settled = true;
    });
    const catchSpy = vi.spyOn(task, "catch");

    expect(() => {
      scheduleBackgroundTask(task);
    }).not.toThrow();
    expect(catchSpy).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);

    await task.catch(() => undefined);
    expect(settled).toBe(true);
  });
});
