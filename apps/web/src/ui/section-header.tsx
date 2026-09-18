import type { ReactNode } from "react";

export function SectionHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="section-header">
      <h2 className="section-header-title">{title}</h2>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
