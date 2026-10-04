"use client";

import { catchError, type ErrorInfo } from "next/error";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";

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
      <Notice
        tone="danger"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              retry();
            }}
          >
            {t.routeError.retry}
          </Button>
        }
      >
        {t.routeError.message}
      </Notice>
    </>
  );
}

export const AppErrorBoundary = catchError(AppErrorFallback);
