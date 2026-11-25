// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { interpolate } from "@/lib/interpolate";
import { t } from "../strings";
import { CategorizarTabs } from "./categorizar-tabs";

function isShown(text: string): boolean {
  return screen.getByText(text).closest("[hidden]") === null;
}

afterEach(() => {
  cleanup();
});

describe("CategorizarTabs", () => {
  it("shows Categorias and Vínculos, the second with its pending count, and switches between them", () => {
    render(
      <CategorizarTabs
        initialTab="categorias"
        pendingLinksCount={3}
        categorias={<p>conteúdo de categorias</p>}
        vinculos={<p>conteúdo de vínculos</p>}
      />,
    );

    expect(screen.getByRole("tab", { name: t.categorizeTabs.categories })).toBeTruthy();
    const linksLabel = interpolate(t.categorizeTabs.linksWithCount, "{count}", "3");
    const linksTab = screen.getByRole("tab", { name: linksLabel });

    expect(isShown("conteúdo de categorias")).toBe(true);
    expect(isShown("conteúdo de vínculos")).toBe(false);

    fireEvent.click(linksTab);

    expect(isShown("conteúdo de vínculos")).toBe(true);
    expect(isShown("conteúdo de categorias")).toBe(false);
  });

  it("shows no count when there are no pending links", () => {
    render(
      <CategorizarTabs
        initialTab="categorias"
        pendingLinksCount={0}
        categorias={<p>conteúdo de categorias</p>}
        vinculos={<p>conteúdo de vínculos</p>}
      />,
    );

    expect(screen.getByRole("tab", { name: t.categorizeTabs.links })).toBeTruthy();
  });

  it("shows no count, and still renders Categorias, when the count could not be read", () => {
    render(
      <CategorizarTabs
        initialTab="categorias"
        pendingLinksCount={null}
        categorias={<p>conteúdo de categorias</p>}
        vinculos={<p>conteúdo de vínculos</p>}
      />,
    );

    expect(screen.getByRole("tab", { name: t.categorizeTabs.links })).toBeTruthy();
    expect(isShown("conteúdo de categorias")).toBe(true);
  });

  it("opens on the Vínculos tab when told to", () => {
    render(
      <CategorizarTabs
        initialTab="vinculos"
        pendingLinksCount={1}
        categorias={<p>conteúdo de categorias</p>}
        vinculos={<p>conteúdo de vínculos</p>}
      />,
    );

    expect(isShown("conteúdo de vínculos")).toBe(true);
    expect(isShown("conteúdo de categorias")).toBe(false);
  });
});
