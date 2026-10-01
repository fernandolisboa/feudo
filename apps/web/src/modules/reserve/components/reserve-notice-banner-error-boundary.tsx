"use client";

import { Component, type ReactNode } from "react";

type BoundaryState = { hasError: boolean };

// The compact notice on Visão geral is a nice-to-have, not the page itself
// (ledger's OverviewErrorBoundary covers the page): a failed read here falls
// back to nothing rendered, never to an error the household has to deal
// with, and never takes the rest of the overview down with it.
export class ReserveNoticeBannerErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
