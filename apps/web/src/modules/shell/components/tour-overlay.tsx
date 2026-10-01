"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/ui/popover";
import { interpolateAll } from "@/lib/interpolate";
import { GUIDE_PATH } from "@/modules/guide";

import { spotlightBox, type Box } from "../spotlight";
import { t } from "../strings";
import { isOnScreen, prefersReducedMotion } from "../tour-dom";
import type { TourStep } from "../tours";

// DESIGN.md hit targets: at least 44px under 768px, 36px above.
const HIT_TARGET = "h-11 md:h-9";

export type TourEnd =
  | { outcome: "completed"; turnOffAutoStart: false }
  | { outcome: "dismissed"; turnOffAutoStart: boolean };

export type TourStepOnScreen = TourStep & { element: HTMLElement };

function toDomRect(box: Box): DOMRect {
  return DOMRect.fromRect({ x: box.left, y: box.top, width: box.width, height: box.height });
}

function measure(element: HTMLElement): Box {
  return spotlightBox(element.getBoundingClientRect(), window.innerHeight);
}

function nextShownIndex(steps: TourStepOnScreen[], from: number, direction: 1 | -1): number | null {
  for (let index = from + direction; index >= 0 && index < steps.length; index += direction) {
    const step = steps[index];
    if (step && isOnScreen(step.element)) {
      return index;
    }
  }
  return null;
}

export function TourOverlay({
  steps,
  onEnd,
}: {
  steps: TourStepOnScreen[];
  onEnd: (end: TourEnd) => void;
}) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const element = step?.element ?? null;
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  useEffect(() => {
    if (!element) {
      return;
    }
    element.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (element) {
          setBox(measure(element));
        }
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [element]);

  const anchor = useMemo(
    () =>
      element
        ? { getBoundingClientRect: () => toDomRect(measure(element)), contextElement: element }
        : null,
    [element],
  );

  if (!step || !anchor) {
    return null;
  }

  function goNext() {
    const next = nextShownIndex(steps, index, 1);
    if (next === null) {
      onEnd({ outcome: "completed", turnOffAutoStart: false });
      return;
    }
    setIndex(next);
  }

  function goBack() {
    const previous = nextShownIndex(steps, index, -1);
    if (previous !== null) {
      setIndex(previous);
    }
  }

  return (
    <>
      {createPortal(
        <div aria-hidden="true" className="tour-scrim" data-dimmed={box === null}>
          {box ? (
            <div
              className="tour-cutout"
              style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
            />
          ) : null}
        </div>,
        document.body,
      )}
      <Popover
        open
        modal="trap-focus"
        onOpenChange={(open) => {
          if (!open) {
            onEnd({ outcome: "dismissed", turnOffAutoStart: false });
          }
        }}
      >
        <PopoverContent
          anchor={anchor}
          side="bottom"
          sideOffset={12}
          collisionPadding={16}
          initialFocus={primaryRef}
          finalFocus={false}
          className="w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-[var(--radius)] p-4 shadow-[var(--elevation)] duration-200 motion-reduce:animate-none"
        >
          <PopoverHeader className="gap-1.5">
            <PopoverTitle className="font-heading text-[18px] font-normal">
              {step.title}
            </PopoverTitle>
            <PopoverDescription className="text-foreground text-sm">{step.body}</PopoverDescription>
          </PopoverHeader>
          <p className="text-muted-foreground text-xs tabular-nums">
            {interpolateAll(t.tour.progress, {
              step: String(index + 1),
              total: String(steps.length),
            })}
          </p>
          <div className="flex items-center justify-between gap-2">
            <PopoverClose render={<Button type="button" variant="ghost" className={HIT_TARGET} />}>
              {t.tour.skip}
            </PopoverClose>
            <div className="flex items-center gap-2">
              {isFirst ? null : (
                <Button type="button" variant="outline" className={HIT_TARGET} onClick={goBack}>
                  {t.tour.back}
                </Button>
              )}
              <Button ref={primaryRef} type="button" className={HIT_TARGET} onClick={goNext}>
                {isLast ? t.tour.finish : t.tour.next}
              </Button>
            </div>
          </div>
          {isFirst ? (
            <Button
              type="button"
              variant="link"
              className={`${HIT_TARGET} self-start px-0`}
              onClick={() => {
                onEnd({ outcome: "dismissed", turnOffAutoStart: true });
              }}
            >
              {t.tour.neverShow}
            </Button>
          ) : null}
          {isLast ? (
            <Button
              variant="link"
              className={`${HIT_TARGET} self-start px-0`}
              render={
                <Link
                  href={GUIDE_PATH}
                  onClick={() => {
                    onEnd({ outcome: "completed", turnOffAutoStart: false });
                  }}
                />
              }
            >
              {t.tour.fullGuide}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
