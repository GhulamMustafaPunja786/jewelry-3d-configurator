"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
};

export class ViewerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[3D viewer]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[360px] w-full flex-col items-center justify-center gap-3 border border-[var(--color-border)] bg-[#f5f1ea] p-6 text-center sm:h-[480px]">
          <p className="font-display text-xl text-[var(--color-ink)]">
            {this.props.fallbackTitle ?? "3D preview unavailable"}
          </p>
          <p className="max-w-sm text-sm text-[var(--color-ink-muted)]">
            Unable to load the 3D preview. You can still configure the jewelry and
            request a quotation.
          </p>
          <Button
            variant="secondary"
            type="button"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
