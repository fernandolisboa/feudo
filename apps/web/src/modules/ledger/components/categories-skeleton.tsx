import { Skeleton } from "@/ui/skeleton";

const RULE_KEYS = ["a", "b", "c"] as const;
const CATEGORY_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-px">
          {RULE_KEYS.map((key) => (
            <Skeleton key={key} className="h-[var(--density-row)] w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <div className="flex flex-col gap-px">
          {CATEGORY_KEYS.map((key) => (
            <Skeleton key={key} className="h-[var(--density-row)] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
