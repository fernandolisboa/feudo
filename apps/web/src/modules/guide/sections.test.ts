import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GUIDE_PATH, GUIDE_SECTIONS, MEU_PLUGGY_GUIDE_HREF } from "./sections";

const APP_ROUTES_DIR = path.resolve(import.meta.dirname, "../../app/(app)");

function pageFileFor(href: string): string {
  return path.join(APP_ROUTES_DIR, href, "page.tsx");
}

describe("GUIDE_SECTIONS", () => {
  it("keeps the anchors other screens and the tour link to", () => {
    expect(GUIDE_SECTIONS.map((section) => section.id)).toEqual([
      "primeiros-passos",
      "meu-pluggy",
      "contas-e-casas",
      "sincronizacao",
      "transacoes",
      "categorias",
      "visao-geral",
      "reserva",
      "privacidade",
      "perguntas-frequentes",
    ]);
  });

  it("gives every section a title and at least one topic with text", () => {
    for (const section of GUIDE_SECTIONS) {
      expect(section.title.trim()).not.toBe("");
      expect(section.topics.length).toBeGreaterThan(0);
      for (const topic of section.topics) {
        expect(topic.title.trim()).not.toBe("");
        expect(topic.body.trim()).not.toBe("");
      }
    }
  });

  it.each(GUIDE_SECTIONS.filter((section) => section.link !== null))(
    "links $id to an existing authenticated route",
    ({ link }) => {
      expect(link?.href).toMatch(/^\/[a-z0-9-/]*$/);
      expect(existsSync(pageFileFor(link?.href ?? ""))).toBe(true);
    },
  );

  it("names the destination screen in every link", () => {
    for (const { link } of GUIDE_SECTIONS) {
      if (link) {
        expect(link.label).toMatch(/^Ir para \S/);
        expect(link.label).not.toContain("{screen}");
      }
    }
  });
});

describe("guide routes", () => {
  it("serves the guide page itself", () => {
    expect(existsSync(pageFileFor(GUIDE_PATH))).toBe(true);
  });

  it("deep-links the Meu Pluggy section", () => {
    expect(MEU_PLUGGY_GUIDE_HREF).toBe("/como-usar#meu-pluggy");
    expect(GUIDE_SECTIONS.some((section) => section.id === "meu-pluggy")).toBe(true);
  });
});
