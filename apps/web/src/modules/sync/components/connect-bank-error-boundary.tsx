import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function ConnectBankErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary message={t.wizard.error.message} retryLabel={t.wizard.error.retry}>
      {children}
    </SectionErrorBoundary>
  );
}
