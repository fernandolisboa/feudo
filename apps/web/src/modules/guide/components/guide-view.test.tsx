// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GUIDE_SECTIONS } from "../sections";
import { GuideView } from "./guide-view";

afterEach(() => {
  cleanup();
});

describe("GuideView", () => {
  it("renders one anchored section per guide section, with its topics", () => {
    const { container } = render(<GuideView />);

    for (const section of GUIDE_SECTIONS) {
      const element = container.querySelector(`section#${section.id}`);
      expect(element).not.toBeNull();
      const scope = within(element as HTMLElement);
      expect(scope.getByRole("heading", { level: 2, name: section.title })).toBeTruthy();
      for (const topic of section.topics) {
        expect(scope.getByRole("heading", { level: 3, name: topic.title })).toBeTruthy();
        expect(scope.getByText(topic.body)).toBeTruthy();
      }
    }
  });

  it("lists every section in the table of contents, pointing at its anchor", () => {
    render(<GuideView />);

    const toc = within(screen.getByRole("navigation", { name: "Nesta página" }));
    for (const section of GUIDE_SECTIONS) {
      expect(toc.getByRole("link", { name: section.title }).getAttribute("href")).toBe(
        `#${section.id}`,
      );
    }
  });

  it("links each section to its screen, and only those that have one", () => {
    const { container } = render(<GuideView />);

    for (const section of GUIDE_SECTIONS) {
      const scope = within(container.querySelector(`section#${section.id}`) as HTMLElement);
      const goTo = scope.queryByRole("link", { name: /^Ir para / });
      if (section.link) {
        expect(goTo?.getAttribute("href")).toBe(section.link.href);
      } else {
        expect(goTo).toBeNull();
      }
    }
  });
});
