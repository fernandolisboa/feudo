// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NotFoundView } from "./not-found-view";

afterEach(() => {
  cleanup();
});

describe("NotFoundView", () => {
  it("explains the address does not exist and links back to Visão geral", () => {
    render(<NotFoundView />);

    expect(screen.getByText(/Este endereço não existe no Feudo/)).not.toBeNull();
    expect(screen.getByRole("link", { name: "Ir para a visão geral" }).getAttribute("href")).toBe(
      "/",
    );
  });
});
