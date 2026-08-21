"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";

export function GenerationProgress({
  progressMessage,
  designId,
  onCancel,
}: {
  progressMessage?: string | null;
  designId?: string | null;
  onCancel?: () => void;
}) {
  const message =
    progressMessage?.trim() ||
    "Our atelier intelligence is shaping your piece…";

  return (
    <div className="flex flex-col items-center justify-center border border-[var(--color-border)] bg-white/80 px-6 py-16 text-center">
      <LoadingSpinner label="" />
      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-[var(--color-gold-deep)]">
        Crafting in progress
      </p>
      <h2 className="font-display mt-3 max-w-md text-3xl text-[var(--color-ink)]">
        {message}
      </h2>
      <p className="mt-4 max-w-sm text-sm text-[var(--color-ink-muted)]">
        This takes a moment. We will open an interactive preview as soon as your
        model is ready — no artificial progress bars.
      </p>
      {designId ? (
        <p className="mt-6 text-xs tracking-wide text-[var(--color-ink-muted)]">
          Draft reference · {designId}
        </p>
      ) : null}
      {onCancel ? (
        <Button type="button" variant="ghost" className="mt-8" onClick={onCancel}>
          Cancel and edit request
        </Button>
      ) : null}
    </div>
  );
}
