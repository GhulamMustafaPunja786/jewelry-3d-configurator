"use client";

import { useEffect, useMemo, useState } from "react";

const LOCAL_FALLBACK_BY_TYPE: Record<string, string> = {
  ring: "/images/ai-placeholders/ring-diamond-concept.svg",
  necklace: "/images/ai-placeholders/necklace-concept.svg",
  chain: "/images/ai-placeholders/chain-concept.svg",
  pendant: "/images/ai-placeholders/pendant-concept.svg",
  bracelet: "/images/ai-placeholders/bracelet-concept.svg",
  earrings: "/images/ai-placeholders/earrings-concept.svg",
};

/**
 * Concept preview with graceful fallback — never shows a broken image icon.
 */
export function ConceptPreviewImage({
  src,
  jewelryType = "ring",
  alt = "Jewelry concept preview",
}: {
  src: string | null | undefined;
  jewelryType?: string;
  alt?: string;
}) {
  const localFallback =
    LOCAL_FALLBACK_BY_TYPE[jewelryType] ?? LOCAL_FALLBACK_BY_TYPE.ring;

  const preferredSrc = useMemo(() => {
    if (!src?.trim()) return localFallback;
    return src;
  }, [src, localFallback]);

  const [currentSrc, setCurrentSrc] = useState(preferredSrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(preferredSrc);
    setFailed(false);
  }, [preferredSrc]);

  if (failed) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 bg-[linear-gradient(160deg,#faf7f0,#efe6d8)] px-4 py-8 text-center">
        <p className="font-display text-lg text-[var(--color-ink)]">
          Preview unavailable
        </p>
        <p className="max-w-xs text-xs text-[var(--color-ink-muted)]">
          The concept illustration could not be loaded. Your interactive 3D
          model above remains the primary visualization.
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className="mx-auto max-h-56 w-auto object-contain"
      onError={() => {
        if (currentSrc !== localFallback) {
          setCurrentSrc(localFallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
