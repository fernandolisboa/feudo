import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function BanksErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary message={t.error.message} retryLabel={t.error.retry}>
      {children}
    </SectionErrorBoundary>
  );
}
