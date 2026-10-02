import { Skeleton } from "@/ui/skeleton";

const CANDIDATE_KEYS = ["first", "second", "third"] as const;

export function BanksSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 pb-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-96 max-w-full" />
      </div>
      <div className="bg-border grid gap-px overflow-hidden rounded-lg border md:grid-cols-3">
        {CANDIDATE_KEYS.map((key) => (
          <div key={key} className="bg-card flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-20 w-full" />
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
