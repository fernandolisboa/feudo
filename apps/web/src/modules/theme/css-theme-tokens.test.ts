import { describe, expect, it } from "vitest";

import { parseDataShellValues, parseThemeCssBlocks } from "./css-theme-tokens";

describe("parseThemeCssBlocks", () => {
  it("parses a :root-combined selector into its theme name", () => {
    const css = `
      :root,
      [data-theme="caderno"] {
        --bg: #f4efe6;
        --ink: #2a2622;
      }
    `;

    expect(parseThemeCssBlocks(css)).toEqual({
      caderno: { "--bg": "#f4efe6", "--ink": "#2a2622" },
    });
  });

  it("parses several theme blocks independently", () => {
    const css = `
      [data-theme="painel"] {
        --bg: #f3f4f6;
      }

      [data-theme="sala"] {
        --bg: #f8f6f2;
      }
    `;

    expect(parseThemeCssBlocks(css)).toEqual({
      painel: { "--bg": "#f3f4f6" },
      sala: { "--bg": "#f8f6f2" },
    });
  });

  it("ignores declarations that are not custom properties", () => {
    const css = `
      [data-theme="caderno"] {
        --ink: #2a2622;
        font-size: 14px;
      }
    `;

    expect(parseThemeCssBlocks(css)).toEqual({
      caderno: { "--ink": "#2a2622" },
    });
  });

  it("does not confuse an unrelated nested block for a theme block", () => {
    const css = `
      @layer components {
        .app-shell-nav[data-shell="sidebar"][data-collapsed="true"] {
          --shell-nav-width: 64px;
        }
      }

      [data-theme="caderno"] {
        --ink: #2a2622;
      }
    `;

    expect(parseThemeCssBlocks(css)).toEqual({
      caderno: { "--ink": "#2a2622" },
    });
  });

  it("returns an empty object for CSS with no theme blocks", () => {
    expect(parseThemeCssBlocks("body { color: red; }")).toEqual({});
  });
});

describe("parseDataShellValues", () => {
  it("collects every distinct data-shell attribute value", () => {
    const css = `
      .app-shell[data-shell="topnav"] { display: block; }
      .app-shell-nav[data-shell="sidebar"] { display: flex; }
      .app-shell-nav[data-shell="sidebar"][data-collapsed="true"] { display: none; }
    `;

    expect(parseDataShellValues(css)).toEqual(new Set(["topnav", "sidebar"]));
  });

  it("returns an empty set when no data-shell attribute is present", () => {
    expect(parseDataShellValues("body { color: red; }")).toEqual(new Set());
  });
});
