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

  it("does not throw and does not block the caller when waitUntil itself throws", () => {
    waitUntilMock.mockImplementation(() => {
      throw new Error("waitUntil unavailable");
    });
    const task = Promise.resolve();

    expect(() => {
      scheduleBackgroundTask(task);
    }).not.toThrow();
  });

  it("never surfaces an unhandled rejection when waitUntil throws and the task rejects", async () => {
    waitUntilMock.mockImplementation(() => {
      throw new Error("waitUntil unavailable");
    });
    const task = Promise.reject(new Error("task failed"));

    expect(() => {
      scheduleBackgroundTask(task);
    }).not.toThrow();
    await expect(task.catch(() => "caught")).resolves.toBe("caught");
  });
});
