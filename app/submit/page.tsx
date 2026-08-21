"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useConfiguratorStore } from "@/store/configurator-store";

function SubmitContent() {
  const params = useSearchParams();
  const designIdParam = params.get("designId");
  const { submittedDesignId, emailWarning, reset } = useConfiguratorStore();
  const designId = designIdParam || submittedDesignId;

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
        Submitted
      </p>
      <h1 className="font-display mt-3 text-4xl text-[var(--color-ink)]">
        Thank you
      </h1>
      <p className="mt-4 text-[var(--color-ink-muted)]">
        Your design has been received by the atelier.
        {designId ? (
          <>
            {" "}
            Reference:{" "}
            <strong className="text-[var(--color-ink)]">{designId}</strong>
          </>
        ) : null}
      </p>
      {emailWarning ? (
        <p className="mt-3 text-sm text-amber-800">
          Email notifications are not configured — your design was still saved
          successfully.
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/create" onClick={() => reset()}>
          <Button>Start another</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Home</Button>
        </Link>
      </div>
      <p className="mt-6 text-xs text-[var(--color-ink-muted)]">
        The atelier team can review your submission in the admin dashboard.
      </p>
    </main>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SubmitContent />
    </Suspense>
  );
}
