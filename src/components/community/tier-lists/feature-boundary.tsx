"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type TierListsFeatureBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type TierListsFeatureBoundaryState = {
  hasError: boolean;
};

class TierListsFeatureBoundaryInner extends Component<
  TierListsFeatureBoundaryProps,
  TierListsFeatureBoundaryState
> {
  state: TierListsFeatureBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): TierListsFeatureBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Tier lists feature failed to render", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function TierListsFeatureBoundary({
  children,
  fallback,
}: TierListsFeatureBoundaryProps) {
  return (
    <TierListsFeatureBoundaryInner fallback={fallback}>
      {children}
    </TierListsFeatureBoundaryInner>
  );
}
