import { Skeleton } from "@/ui/skeleton";

const TILE_KEYS = ["target", "average-fixed-cost", "current-reserve", "coverage"] as const;

export function ReserveSkeleton() {
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
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
