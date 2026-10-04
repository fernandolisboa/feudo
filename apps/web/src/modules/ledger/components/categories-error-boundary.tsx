import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function CategoriesErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary
      message={t.categoriesPage.error.message}
      retryLabel={t.categoriesPage.error.retry}
    >
      {children}
    </SectionErrorBoundary>
  );
}
