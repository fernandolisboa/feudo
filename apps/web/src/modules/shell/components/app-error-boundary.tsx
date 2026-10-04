"use client";

import { catchError, type ErrorInfo } from "next/error";

import { PageHeader } from "@/ui/page-header";
import { RetryNotice } from "@/ui/retry-notice";
import { isBrowserOffline } from "@/lib/offline-writes";

import { t } from "../strings";

// The page-level counterpart of an app/(app)/error.tsx: that file must be a
// Client Component, and a client file cannot import a slice's index without
// pulling its server-only code into the browser bundle. catchError gives the
// same retry (refresh + reset in one transition) from inside the layout.
// As in ui/section-error-boundary, the thrown error is never rendered.
function AppErrorFallback(_props: object, { retry }: ErrorInfo) {
  return (
    <>
      <PageHeader overline={t.routeError.overline} title={t.routeError.title} />
      <RetryNotice
        message={isBrowserOffline() ? t.routeError.offlineMessage : t.routeError.message}
        retryLabel={t.routeError.retry}
        onRetry={retry}
      />
    </>
  );
}

export const AppErrorBoundary = catchError(AppErrorFallback);
