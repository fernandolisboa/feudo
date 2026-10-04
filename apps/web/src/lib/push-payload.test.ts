import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { FORGET_PUSH_DEVICE_PATH, parsePushPayload } from "./push-payload";

const valid = { title: "Meta da reserva", body: "Mudou.", url: "/reserva", tag: "reserve:h1" };

describe("parsePushPayload", () => {
  it("accepts a notification that opens a screen inside Feudo", () => {
    expect(parsePushPayload(valid)).toEqual(valid);
  });

  it.each([
    ["another origin", { ...valid, url: "https://elsewhere.test/" }],
    ["a protocol-relative address", { ...valid, url: "//elsewhere.test/" }],
    ["a backslash the browser reads as a slash", { ...valid, url: "/\\elsewhere.test/" }],
    ["a tab the browser strips", { ...valid, url: "/\t/elsewhere.test/" }],
    ["a script address", { ...valid, url: "javascript:alert(1)" }],
    ["an empty title", { ...valid, title: "" }],
    ["a missing tag", { title: valid.title, body: valid.body, url: valid.url }],
    ["a non-object", "texto"],
    ["null", null],
  ])("refuses %s", (_label, payload) => {
    expect(parsePushPayload(payload)).toBeNull();
  });
});

describe("FORGET_PUSH_DEVICE_PATH", () => {
  it("names the route that answers it", () => {
    const route = new URL(`../app${FORGET_PUSH_DEVICE_PATH}/route.ts`, import.meta.url);
    expect(existsSync(fileURLToPath(route))).toBe(true);
  });
});
