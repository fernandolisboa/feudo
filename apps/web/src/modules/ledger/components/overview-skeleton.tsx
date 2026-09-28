import { Skeleton } from "@/ui/skeleton";

const TILE_KEYS = ["income", "spending", "savings-rate", "average-fixed-cost"] as const;
const BAR_KEYS = ["a", "b", "c", "d"] as const;

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-80" />
      </div>
      <div className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4">
        {TILE_KEYS.map((key) => (
          <div key={key} className="bg-card flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-8 md:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          {BAR_KEYS.map((key) => (
            <Skeleton key={key} className="h-6 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
