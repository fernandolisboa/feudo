import type { ReactNode } from "react";

export function SectionHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="section-header">
      <h2 className="section-header-title">{title}</h2>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : meta ? (
        <span className="section-header-meta">{meta}</span>
      ) : null}
    </div>
  );
}
