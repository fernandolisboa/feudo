// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button, buttonVariants } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { Select, SelectTrigger, SelectValue } from "./select";

// DESIGN.md "Spacing and layout": hit targets ≥ 44px under 768px (h-11), ≥ 36px above (md:h-9).
function sizeTokens(className: string): string[] {
  return className
    .split(/\s+/)
    .filter((token) => /^(?:md:)?(?:h|w|size)-[\d.]+$/.test(token))
    .sort();
}

const BUTTON_SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

afterEach(cleanup);

describe("shared control hit targets", () => {
  it.each(BUTTON_SIZES)("Button size %s is 44px on mobile and 36px from md up", (size) => {
    const expected = size.startsWith("icon")
      ? ["h-11", "md:h-9", "w-11", "md:w-9"]
      : ["h-11", "md:h-9"];

    expect(sizeTokens(buttonVariants({ size }))).toEqual(expected.sort());
  });

  it("Button renders the default size with both heights", () => {
    render(<Button>Salvar</Button>);

    expect(sizeTokens(screen.getByRole("button").className)).toEqual(["h-11", "md:h-9"]);
  });

  it.each(["default", "sm"] as const)(
    "SelectTrigger size %s is 44px on mobile and 36px from md up",
    (size) => {
      render(
        <Select items={[{ value: "a", label: "A" }]} defaultValue="a">
          <SelectTrigger size={size} aria-label="Opção">
            <SelectValue />
          </SelectTrigger>
        </Select>,
      );

      expect(sizeTokens(screen.getByRole("combobox").className)).toEqual(["h-11", "md:h-9"]);
    },
  );

  it("Input is 44px on mobile and 36px from md up", () => {
    render(<Input aria-label="Busca" />);

    expect(sizeTokens(screen.getByRole("textbox").className)).toEqual(["h-11", "md:h-9"]);
  });

  it("Dialog keeps its header clear of the 44px close button", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar posição</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog").className).toContain("**:data-[slot=dialog-header]:pr-9");
  });
});
