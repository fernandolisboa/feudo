"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { recordTourOutcomeAction } from "../actions";
import { findVisibleTarget, hasOpenDialog } from "../tour-dom";
import { markTourSeen, shouldAutoStart, type TourState } from "../tour-state";
import { tourForPath, type TourDefinition } from "../tours";
import { TourOverlay, type TourEnd, type TourStepOnScreen } from "./tour-overlay";

// How long a first visit waits for the screen's data (a Suspense boundary, a
// slow query) before giving up on auto-starting; the tour then waits for the
// next visit instead of popping up over a page the person is already using.
const AUTO_START_WAIT_MS = 10_000;

type ActiveTour = {
  tour: TourDefinition;
  steps: TourStepOnScreen[];
  returnFocus: HTMLElement | null;
};

type TourContextValue = { currentTour: TourDefinition | null; startCurrentTour: () => void };

const TourContext = createContext<TourContextValue>({
  currentTour: null,
  startCurrentTour: () => undefined,
});

export function useTour(): TourContextValue {
  return useContext(TourContext);
}

function stepsOnScreen(tour: TourDefinition): TourStepOnScreen[] {
  return tour.steps.flatMap((step) => {
    const element = findVisibleTarget(step.target);
    return element ? [{ ...step, element }] : [];
  });
}

export function TourProvider({
  initialState,
  children,
}: {
  initialState: TourState;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentTour = tourForPath(pathname);
  const [state, setState] = useState(initialState);
  const [active, setActive] = useState<ActiveTour | null>(null);

  // The layout re-renders with fresh server state after a preferences change
  // (revalidatePath); adopt it during render so the next auto-start decision
  // uses it, not the state this provider was first mounted with.
  const [lastInitialState, setLastInitialState] = useState(initialState);
  if (initialState !== lastInitialState) {
    setLastInitialState(initialState);
    setState(initialState);
  }

  // Leaving the screen mid-tour ends it without recording anything, so it
  // shows again on the next visit.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setActive(null);
  }

  const begin = useCallback((tour: TourDefinition): boolean => {
    const steps = stepsOnScreen(tour);
    if (steps.length === 0) {
      return false;
    }
    const focused = document.activeElement;
    setActive({ tour, steps, returnFocus: focused instanceof HTMLElement ? focused : null });
    return true;
  }, []);

  useEffect(() => {
    if (!currentTour || active || !shouldAutoStart(currentTour, state)) {
      return;
    }
    const tour = currentTour;
    let settled = false;

    function stop() {
      settled = true;
      observer.disconnect();
      window.clearTimeout(timeout);
    }
    function tryStart() {
      if (settled || hasOpenDialog() || findVisibleTarget(tour.readyTarget) === null) {
        return;
      }
      if (begin(tour)) {
        stop();
      }
    }

    const observer = new MutationObserver(tryStart);
    const timeout = window.setTimeout(stop, AUTO_START_WAIT_MS);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    tryStart();
    return stop;
  }, [currentTour, active, state, begin]);

  const startCurrentTour = useCallback(() => {
    if (!currentTour) {
      return;
    }
    const tour = currentTour;
    // Lets the user menu finish closing and hand focus back to its trigger
    // first, so the tour returns focus there when it ends.
    window.requestAnimationFrame(() => {
      begin(tour);
    });
  }, [currentTour, begin]);

  function end(result: TourEnd) {
    if (!active) {
      return;
    }
    const { tour, returnFocus } = active;
    setActive(null);
    setState((current) => markTourSeen(current, tour, result.turnOffAutoStart));
    window.requestAnimationFrame(() => {
      if (returnFocus?.isConnected) {
        returnFocus.focus();
      }
    });
    recordTourOutcomeAction({
      tourId: tour.id,
      outcome: result.outcome,
      turnOffAutoStart: result.turnOffAutoStart,
    }).catch(() => {
      // A lost write only means this tour may show again on the next visit;
      // the person already closed it here, so there is nothing to surface.
    });
  }

  return (
    <TourContext value={{ currentTour, startCurrentTour }}>
      {children}
      {active ? <TourOverlay key={active.tour.id} steps={active.steps} onEnd={end} /> : null}
    </TourContext>
  );
}
