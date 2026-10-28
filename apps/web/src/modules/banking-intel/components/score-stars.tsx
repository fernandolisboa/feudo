"use client";

import { StarIcon } from "lucide-react";

import { interpolate } from "@/lib/interpolate";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";

import { t } from "../strings";

const STAR_COUNT = 5;
const POINTS_PER_STAR = 100 / STAR_COUNT;

const STAR_SIZE = { sm: "size-4", lg: "size-6" } as const;

export function starFills(score: number): number[] {
  return Array.from({ length: STAR_COUNT }, (_, index) =>
    Math.min(Math.max(score / POINTS_PER_STAR - index, 0), 1),
  );
}

function Star({ fill, size }: { fill: number; size: keyof typeof STAR_SIZE }) {
  return (
    <span className="relative inline-flex">
      <StarIcon
        aria-hidden
        strokeWidth={1.5}
        className={cn(STAR_SIZE[size], "text-muted-foreground")}
      />
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${String(Math.round(fill * 100))}%` }}
      >
        <StarIcon
          aria-hidden
          strokeWidth={1.5}
          className={cn(STAR_SIZE[size], "text-brand max-w-none fill-current")}
        />
      </span>
    </span>
  );
}

// Base UI tooltips never open on touch, so the score sits in a popover that opens on hover and
// on tap alike.
export function ScoreStars({
  score,
  size = "sm",
}: {
  score: number;
  size?: keyof typeof STAR_SIZE;
}) {
  const value = String(score);
  const label = interpolate(t.stars.label, "{score}", value);
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={0}
        aria-label={label}
        className="focus-visible:ring-ring/50 inline-flex h-11 cursor-default items-center gap-0.5 rounded-sm outline-none focus-visible:ring-3 md:h-9"
      >
        {starFills(score).map((fill, index) => (
          <Star key={index} fill={fill} size={size} />
        ))}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        aria-label={label}
        className="bg-foreground text-background w-auto rounded-md px-3 py-1.5 text-[12px] tabular-nums shadow-none ring-0"
      >
        {interpolate(t.stars.value, "{score}", value)}
      </PopoverContent>
    </Popover>
  );
}
