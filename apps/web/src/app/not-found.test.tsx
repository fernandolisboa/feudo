// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import NotFound from "./not-found";

afterEach(() => {
  cleanup();
});

describe("NotFound", () => {
  it("renders the pt-BR not-found page with a link to Visão geral", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "Página não encontrada" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Ir para a visão geral" }).getAttribute("href")).toBe(
      "/",
    );
  });
});
