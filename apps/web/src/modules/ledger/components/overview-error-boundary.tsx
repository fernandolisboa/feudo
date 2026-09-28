"use client";

import { Component, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";

import { t } from "../strings";

function OverviewErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <Notice
      tone="danger"
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t.overview.error.retry}
        </Button>
      }
    >
      {t.overview.error.message}
    </Notice>
  );
}

type BoundaryState = { hasError: boolean };

// A plain React error boundary, not the app/(app)/error.tsx file convention:
// that convention is per route segment, so it would also catch a sibling
// route's render errors once no segment along the way overrides it; this one
// wraps only the overview's own async content (design contract).
class Boundary extends Component<{ children: ReactNode; onRetry: () => void }, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  private retry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <OverviewErrorFallback onRetry={this.retry} />;
    }
    return this.props.children;
  }
}

export function OverviewErrorBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <Boundary
      onRetry={() => {
        router.refresh();
      }}
    >
      {children}
    </Boundary>
  );
}
