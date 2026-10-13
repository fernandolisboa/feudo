"use client";

import { catchError } from "next/error";

// The summary tab's own boundary reports the failed read with a retry; the
// header just steps aside so the error shows once.
export const OverviewHeaderErrorBoundary = catchError(() => null);
