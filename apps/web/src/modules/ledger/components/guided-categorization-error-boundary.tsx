import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function GuidedCategorizationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary message={t.guided.error.message} retryLabel={t.guided.error.retry}>
      {children}
    </SectionErrorBoundary>
  );
}
