import { Skeleton } from "@/ui/skeleton";

const FILTER_KEYS = ["account", "search", "kind", "category"] as const;
const ROW_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 pb-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-80 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTER_KEYS.map((key) => (
          <Skeleton key={key} className="h-9 w-40" />
        ))}
      </div>
      <Skeleton className="h-4 w-64" />
      <div className="flex flex-col gap-px">
        {ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-[var(--density-row)] w-full" />
        ))}
      </div>
    </div>
  );
}
