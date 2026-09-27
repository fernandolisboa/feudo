import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="status"
      className="border-border bg-card mb-4 flex flex-col items-start gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center"
    >
      <CircleAlert aria-hidden className="text-warning size-4 shrink-0" />
      <p className="flex-1 text-[13px]">{children}</p>
      {action}
    </div>
  );
}
