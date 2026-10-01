import { describe, expect, it } from "vitest";

import { isTourId, TOUR_IDS, TOURS, tourForPath } from "./tours";

describe("tours", () => {
  it("registers each tour under its own id", () => {
    for (const id of TOUR_IDS) {
      expect(TOURS[id].id).toBe(id);
    }
  });

  it("gives every screen at most one tour and every step a target named after its tour", () => {
    const paths = Object.values(TOURS).map((tour) => tour.path);
    expect(new Set(paths).size).toBe(paths.length);

    for (const tour of Object.values(TOURS)) {
      expect(tour.steps.length).toBeGreaterThanOrEqual(3);
      expect(tour.steps.length).toBeLessThanOrEqual(4);
      for (const step of tour.steps) {
        expect(step.target.startsWith(`${tour.id}.`)).toBe(true);
      }
      expect(tour.steps.map((step) => step.target)).toContain(tour.readyTarget);
    }
  });

  it("finds the tour for a screen and none for screens without one", () => {
    expect(tourForPath("/")?.id).toBe("overview");
    expect(tourForPath("/transacoes")?.id).toBe("transactions");
    expect(tourForPath("/categorias")?.id).toBe("categories");
    expect(tourForPath("/casa")?.id).toBe("household");
    expect(tourForPath("/conectar-banco")).toBeNull();
    expect(tourForPath("/preferencias")).toBeNull();
  });

  it("accepts only the ids in the tour list", () => {
    expect(isTourId("overview")).toBe(true);
    expect(isTourId("reserve")).toBe(false);
    expect(isTourId("")).toBe(false);
  });
});
