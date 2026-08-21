"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
        Something went wrong
      </p>
      <h1 className="font-display mt-3 text-3xl text-[var(--color-ink)]">
        This page couldn’t load
      </h1>
      <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
        {error.message || "Reload to try again, or go back to the studio."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-[var(--color-ink)] px-5 py-2.5 text-sm text-white"
        >
          Reload
        </button>
        <Link
          href="/"
          className="border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm text-[var(--color-ink)]"
        >
          Back
        </Link>
      </div>
    </main>
  );
}
