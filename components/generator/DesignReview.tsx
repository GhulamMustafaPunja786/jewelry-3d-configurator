"use client";

import { useState } from "react";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";
import { GlbJewelryViewerDynamic } from "@/components/viewer/GlbJewelryViewerDynamic";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type { GeneratorVersion } from "@/store/generator-store";

export function DesignReview({
  versions,
  selectedVersionId,
  onSelectVersion,
  onUseDesign,
  onGenerateAnother,
  regenerating,
}: {
  versions: GeneratorVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onUseDesign: () => void;
  onGenerateAnother: (feedback?: string) => Promise<void> | void;
  regenerating?: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const selected =
    versions.find((v) => v.id === selectedVersionId) ??
    versions[versions.length - 1];

  if (!selected) {
    return (
      <div className="border border-[var(--color-border)] bg-white/80 p-8 text-center">
        <p className="font-display text-2xl">No design version yet</p>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Generate a piece to review it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-deep)]">
          Design review · Version {selected.versionNumber}
        </p>
        <h2 className="font-display mt-2 text-3xl text-[var(--color-ink)]">
          Explore your piece
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">
          {VISUALIZATION_DISCLAIMER}
        </p>
      </div>

      <GlbJewelryViewerDynamic
        modelUrl={selected.modelUrl}
        allowProceduralFallback
      />

      {versions.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {versions.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVersion(v.id)}
              className={`rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                v.id === selected.id
                  ? "border-[var(--color-gold)] bg-[var(--color-gold-soft)] text-[var(--color-ink)]"
                  : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-gold)]"
              }`}
            >
              V{v.versionNumber}
            </button>
          ))}
        </div>
      ) : null}

      <div>
        <Label htmlFor="regen-feedback">Feedback for another generation</Label>
        <textarea
          id="regen-feedback"
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Make the band thinner, add a halo, warmer gold tone…"
          className="w-full rounded-sm border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-gold)]"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onUseDesign}>
          Use this design
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={regenerating}
          onClick={() => onGenerateAnother(feedback.trim() || undefined)}
        >
          {regenerating ? "Generating…" : "Generate another"}
        </Button>
      </div>
    </div>
  );
}
