"use client";

import { catchError, type ErrorInfo } from "next/error";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";

type SectionErrorProps = { message: string; retryLabel: string; className?: string };

// The thrown error is never rendered (it may describe another household's
// data); the client sees only the section's copy and the server log keeps
// the real error.
function SectionErrorFallback(
  { message, retryLabel, className }: SectionErrorProps,
  { retry }: ErrorInfo,
) {
  const notice = (
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
          {retryLabel}
        </Button>
      }
    >
      {message}
    </Notice>
  );
  return className ? <div className={className}>{notice}</div> : notice;
}

export const SectionErrorBoundary = catchError(SectionErrorFallback);
