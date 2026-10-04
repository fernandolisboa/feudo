"use client";

import { catchError, type ErrorInfo } from "next/error";

import { RetryNotice } from "@/ui/retry-notice";

type SectionErrorProps = { message: string; retryLabel: string; className?: string };

// The thrown error is never rendered (it may describe another household's
// data); the client sees only the section's copy and the server log keeps
// the real error.
function SectionErrorFallback(
  { message, retryLabel, className }: SectionErrorProps,
  { retry }: ErrorInfo,
) {
  const notice = <RetryNotice message={message} retryLabel={retryLabel} onRetry={retry} />;
  return className ? <div className={className}>{notice}</div> : notice;
}

export const SectionErrorBoundary = catchError(SectionErrorFallback);
