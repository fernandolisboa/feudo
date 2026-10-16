"use client";

import { Component, type ReactNode } from "react";

type BoundaryState = { hasError: boolean };

// "Chave e modelos do analista" is one section of the Casa page, not the
// page itself: a failed read here falls back to nothing rendered, never to
// an error the household has to deal with, and never takes the rest of Casa
// (members, invites) down with it.
export class AiSettingsErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
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
