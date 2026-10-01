// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const recordTourOutcomeActionMock = vi.hoisted(() => vi.fn());
const pathnameMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock("../actions", () => ({ recordTourOutcomeAction: recordTourOutcomeActionMock }));

import { t } from "../strings";
import type { TourState } from "../tour-state";
import { TOURS } from "../tours";
import { TourProvider, useTour } from "./tour-provider";

const overview = TOURS.overview;
const [navStep, householdStep, accountsStep, helpStep] = overview.steps;

function rect(width: number, height: number): DOMRect {
  return DOMRect.fromRect({ x: 10, y: 10, width, height });
}

beforeEach(() => {
  recordTourOutcomeActionMock.mockReset();
  recordTourOutcomeActionMock.mockResolvedValue({ status: "success", message: "" });
  pathnameMock.mockReturnValue("/");
  // jsdom lays nothing out: every element measures 0×0, which the tour reads
  // as "not on screen". Give tour targets a size unless a test hides them.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.dataset.tour && !this.hidden ? rect(120, 32) : rect(0, 0);
  });
  HTMLElement.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function StartButton() {
  const { currentTour, startCurrentTour } = useTour();
  return currentTour ? (
    <button type="button" onClick={startCurrentTour}>
      start
    </button>
  ) : null;
}

function renderOverview(state: TourState, options: { hidden?: string[] } = {}) {
  return render(
    <TourProvider initialState={state}>
      {overview.steps.map((step) => (
        <div
          key={step.target}
          data-tour={step.target}
          hidden={options.hidden?.includes(step.target)}
        >
          {step.target}
        </div>
      ))}
      <StartButton />
    </TourProvider>,
  );
}

const fresh: TourState = { autoStart: true, seenVersions: {} };

describe("TourProvider", () => {
  it("starts the screen's tour on a first visit, as a dialog named after the step", async () => {
    renderOverview(fresh);

    const dialog = await screen.findByRole("dialog", { name: navStep?.title });
    expect(dialog.textContent).toContain(navStep?.body);
    expect(dialog.textContent).toContain("1 de 4");
  });

  it("walks forward and back through the steps", async () => {
    renderOverview(fresh);

    fireEvent.click(await screen.findByRole("button", { name: t.tour.next }));
    expect(await screen.findByRole("dialog", { name: householdStep?.title })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: t.tour.back }));
    expect(await screen.findByRole("dialog", { name: navStep?.title })).not.toBeNull();
    expect(screen.queryByRole("button", { name: t.tour.back })).toBeNull();
  });

  it("records a dismissal when the tour is skipped and does not start it again", async () => {
    renderOverview(fresh);

    fireEvent.click(await screen.findByRole("button", { name: t.tour.skip }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(recordTourOutcomeActionMock).toHaveBeenCalledWith({
      tourId: "overview",
      outcome: "dismissed",
      turnOffAutoStart: false,
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("treats Escape as skipping the tour", async () => {
    renderOverview(fresh);
    const dialog = await screen.findByRole("dialog");

    fireEvent.keyDown(dialog, { key: "Escape" });

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(recordTourOutcomeActionMock).toHaveBeenCalledWith({
      tourId: "overview",
      outcome: "dismissed",
      turnOffAutoStart: false,
    });
  });

  it("offers 'Não mostrar tutoriais' on the first step, which also turns auto-start off", async () => {
    renderOverview(fresh);

    fireEvent.click(await screen.findByRole("button", { name: t.tour.neverShow }));

    expect(recordTourOutcomeActionMock).toHaveBeenCalledWith({
      tourId: "overview",
      outcome: "dismissed",
      turnOffAutoStart: true,
    });
  });

  it("records a completion on the last step and links to the full guide", async () => {
    renderOverview(fresh);

    for (let step = 1; step < overview.steps.length; step += 1) {
      fireEvent.click(await screen.findByRole("button", { name: t.tour.next }));
    }
    expect(await screen.findByRole("dialog", { name: helpStep?.title })).not.toBeNull();
    expect(screen.getByRole("link", { name: t.tour.fullGuide }).getAttribute("href")).toBe(
      "/como-usar",
    );
    expect(screen.queryByRole("button", { name: t.tour.neverShow })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: t.tour.finish }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(recordTourOutcomeActionMock).toHaveBeenCalledWith({
      tourId: "overview",
      outcome: "completed",
      turnOffAutoStart: false,
    });
  });

  it("skips a step whose target is not on screen and counts only the steps shown", async () => {
    renderOverview(fresh, { hidden: [householdStep?.target ?? ""] });

    expect(await screen.findByRole("dialog", { name: navStep?.title })).not.toBeNull();
    expect(screen.getByText("1 de 3")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: t.tour.next }));
    expect(await screen.findByRole("dialog", { name: accountsStep?.title })).not.toBeNull();
  });

  it("waits for the screen's data before starting", async () => {
    renderOverview(fresh, { hidden: [overview.readyTarget] });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    act(() => {
      const ready = document.querySelector<HTMLElement>(`[data-tour="${overview.readyTarget}"]`);
      if (ready) {
        ready.hidden = false;
      }
    });

    expect(await screen.findByRole("dialog", { name: navStep?.title })).not.toBeNull();
  });

  it("does not start on top of an open dialog", async () => {
    render(
      <TourProvider initialState={fresh}>
        <div role="dialog" aria-label="Convidar" />
        {overview.steps.map((step) => (
          <div key={step.target} data-tour={step.target} />
        ))}
      </TourProvider>,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it.each([
    { name: "tutorials are turned off", state: { autoStart: false, seenVersions: {} } },
    {
      name: "the tour was already closed at its current version",
      state: { autoStart: true, seenVersions: { overview: overview.version } },
    },
  ])("does not auto-start when $name, but still starts on request", async ({ state }) => {
    renderOverview(state);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "start" }));
    expect(await screen.findByRole("dialog", { name: navStep?.title })).not.toBeNull();
  });

  it("offers nothing to start on a screen without a tour", () => {
    pathnameMock.mockReturnValue("/conectar-banco");
    renderOverview(fresh);

    expect(screen.queryByRole("button", { name: "start" })).toBeNull();
  });
});
