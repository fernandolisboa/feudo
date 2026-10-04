import type { ReactNode } from "react";

import { SectionErrorBoundary } from "@/ui/section-error-boundary";

import { t } from "../strings";

export function PreferencesSectionErrorBoundary({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <SectionErrorBoundary
      message={t.preferences.sectionError.message}
      retryLabel={t.preferences.sectionError.retry}
      className={className}
    >
      {children}
    </SectionErrorBoundary>
  );
}
