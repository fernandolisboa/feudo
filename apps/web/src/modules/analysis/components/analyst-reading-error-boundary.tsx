"use client";

import { Component, type ReactNode } from "react";

type BoundaryState = { hasError: boolean };

// The reading is optional to both pages (ADR-0004): a failed read renders
// nothing, never an error the household has to deal with, and never takes
// the page around it down.
export class AnalystReadingErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
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
