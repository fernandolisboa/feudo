import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <span className="text-lg font-semibold tracking-tight">Feudo</span>
      <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
