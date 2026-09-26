import type { ReactNode } from "react";

export function PageHeader({
  overline,
  title,
  actions,
}: {
  overline: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="page-header-overline">{overline}</p>
        <h1 className="page-header-title">{title}</h1>
      </div>
      {actions ? (
        <div className="page-header-actions flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
