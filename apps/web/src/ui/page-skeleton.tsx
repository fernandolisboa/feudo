import { Skeleton } from "@/ui/skeleton";

const ROW_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-px">
        {ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
