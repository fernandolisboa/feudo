import { describe, expect, it } from "vitest";

import { parsePushPayload } from "./push-payload";

const valid = { title: "Meta da reserva", body: "Mudou.", url: "/reserva", tag: "reserve:h1" };

describe("parsePushPayload", () => {
  it("accepts a notification that opens a screen inside Feudo", () => {
    expect(parsePushPayload(valid)).toEqual(valid);
  });

  it.each([
    ["another origin", { ...valid, url: "https://elsewhere.test/" }],
    ["a protocol-relative address", { ...valid, url: "//elsewhere.test/" }],
    ["a script address", { ...valid, url: "javascript:alert(1)" }],
    ["an empty title", { ...valid, title: "" }],
    ["a missing tag", { title: valid.title, body: valid.body, url: valid.url }],
    ["a non-object", "texto"],
    ["null", null],
  ])("refuses %s", (_label, payload) => {
    expect(parsePushPayload(payload)).toBeNull();
  });
});
