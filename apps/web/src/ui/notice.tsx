import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

const TONE_ICON_CLASS = { warning: "text-warning", danger: "text-danger" } as const;

export function Notice({
  children,
  action,
  tone = "warning",
}: {
  children: ReactNode;
  action?: ReactNode;
  tone?: "warning" | "danger";
}) {
  return (
    <div
      role="status"
      className="border-border bg-card mb-4 flex flex-col items-start gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center"
    >
      <CircleAlert aria-hidden className={`${TONE_ICON_CLASS[tone]} size-4 shrink-0`} />
      <p className="flex-1 text-[13px]">{children}</p>
      {action}
    </div>
  );
}
