import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function TransactionLinksErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary message={t.links.error.message} retryLabel={t.links.error.retry}>
      {children}
    </SectionErrorBoundary>
  );
}
