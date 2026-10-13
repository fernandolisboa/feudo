import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function AnalysesErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary message={t.analyses.loadFailed} retryLabel={t.analyses.retry}>
      {children}
    </SectionErrorBoundary>
  );
}
