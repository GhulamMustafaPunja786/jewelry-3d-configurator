"use client";

import { useState } from "react";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";
import { GlbJewelryViewerDynamic } from "@/components/viewer/GlbJewelryViewerDynamic";
import { ConceptPreviewImage } from "@/components/generator/ConceptPreviewImage";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type { GeneratorVersion } from "@/store/generator-store";

export function DesignReview({
  versions,
  selectedVersionId,
  onSelectVersion,
  onUseDesign,
  onGenerateAnother,
  onEditRequest,
  onStartOver,
  regenerating,
  jewelryType = "ring",
}: {
  versions: GeneratorVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onUseDesign: () => void;
  onGenerateAnother: (feedback?: string) => Promise<void> | void;
  onEditRequest: () => void;
  onStartOver: () => void;
  regenerating?: boolean;
  jewelryType?: string;
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
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={onEditRequest}>
            Back to form
          </Button>
          <Button type="button" variant="secondary" onClick={onStartOver}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-deep)]">
            Design review · Version {selected.versionNumber}
          </p>
          <h2 className="font-display mt-2 text-3xl text-[var(--color-ink)]">
            Explore your piece
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={onEditRequest}>
            Edit request
          </Button>
          <Button type="button" variant="secondary" onClick={onStartOver}>
            Start over
          </Button>
        </div>
      </div>

      <GlbJewelryViewerDynamic
        modelUrl={selected.modelUrl}
        allowProceduralFallback
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-[var(--color-border)] bg-white/70 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
            Concept preview
          </p>
          <ConceptPreviewImage
            src={selected.previewUrl}
            jewelryType={jewelryType}
          />
        </div>
        <p className="self-center text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Illustration for mood and silhouette only. Dimensions, metal purity,
          and stone grades are confirmed by atelier specialists after you
          submit.
        </p>
      </div>

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

      <aside
        className="border border-[var(--color-gold)]/40 bg-[var(--color-gold-soft)]/60 px-4 py-4 sm:px-5"
        role="note"
        aria-label="Visualization disclaimer"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
          Important · Studio visualization
        </p>
        <p className="font-display mt-2 text-xl leading-snug text-[var(--color-ink)] sm:text-2xl">
          This is a studio visualization — not manufacturing CAD.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {VISUALIZATION_DISCLAIMER}
        </p>
      </aside>

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
        <Button type="button" variant="ghost" onClick={onEditRequest}>
          Back to form
        </Button>
      </div>
    </div>
  );
}
