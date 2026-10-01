"use client";

import { Component, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";

import { t } from "../strings";

function ReserveErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <Notice
      tone="danger"
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t.error.retry}
        </Button>
      }
    >
      {t.error.message}
    </Notice>
  );
}

type BoundaryState = { hasError: boolean };

// A plain React error boundary scoped to this page's own async content, like
// ledger's OverviewErrorBoundary, not the app/(app)/error.tsx convention
// (design contract).
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
      return <ReserveErrorFallback onRetry={this.retry} />;
    }
    return this.props.children;
  }
}

export function ReserveErrorBoundary({ children }: { children: ReactNode }) {
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
