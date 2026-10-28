// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScoreStars, starFills } from "./score-stars";

afterEach(cleanup);

describe("starFills", () => {
  it("fills one star per 20 points and the next one by the remainder", () => {
    expect(starFills(63)).toEqual([1, 1, 1, expect.closeTo(0.15, 10), 0]);
  });

  it("leaves every star empty at 0 and fills all of them at 100", () => {
    expect(starFills(0)).toEqual([0, 0, 0, 0, 0]);
    expect(starFills(100)).toEqual([1, 1, 1, 1, 1]);
  });

  it("fills whole stars only on multiples of 20", () => {
    expect(starFills(40)).toEqual([1, 1, 0, 0, 0]);
  });
});

describe("ScoreStars", () => {
  it("names the score for screen readers", () => {
    render(<ScoreStars score={63} />);

    expect(screen.getByRole("button", { name: "Nota 63 de 100" })).not.toBeNull();
  });

  it("shows the score out of 100 on tap, where hover never happens", async () => {
    render(<ScoreStars score={63} />);

    fireEvent.click(screen.getByRole("button", { name: "Nota 63 de 100" }));

    expect(await screen.findByText("63/100")).not.toBeNull();
  });

  it("shows the score out of 100 on hover", async () => {
    render(<ScoreStars score={63} />);

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Nota 63 de 100" }));

    expect(await screen.findByText("63/100")).not.toBeNull();
  });
});
