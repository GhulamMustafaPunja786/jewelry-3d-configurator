"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryGrid } from "@/components/jewelry/CategoryGrid";
import { RingConfiguratorForm } from "@/components/forms/RingConfiguratorForm";
import { JewelryViewerDynamic } from "@/components/viewer/JewelryViewerDynamic";
import { useConfiguratorStore } from "@/store/configurator-store";
import type { JewelryCategory } from "@/types/jewelry";
import { CATEGORIES } from "@/data/categories";

export default function DesignClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as JewelryCategory | null;
  const { category, config, setCategory, setStep } = useConfiguratorStore();

  useEffect(() => {
    if (categoryParam && CATEGORIES.some((c) => c.id === categoryParam)) {
      setCategory(categoryParam);
    }
  }, [categoryParam, setCategory]);

  const showRing = category === "ring" || categoryParam === "ring";
  const comingSoon =
    categoryParam &&
    categoryParam !== "ring" &&
    CATEGORIES.find((c) => c.id === categoryParam);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--color-ink)]">
          Design studio
        </h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Select a category, configure your piece, and preview it in 3D.
        </p>
      </div>

      {!showRing ? (
        <div className="space-y-6">
          {comingSoon ? (
            <div className="border border-[var(--color-border)] bg-white/70 p-6">
              <h2 className="font-display text-2xl">{comingSoon.label}</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Coming soon — the shared architecture is ready; configuration for
                this category will open in a later release.
              </p>
            </div>
          ) : null}
          <CategoryGrid />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="order-1">
            <RingConfiguratorForm
              onContinue={() => {
                setStep("quotation");
                router.push("/quotation");
              }}
            />
          </div>
          <div className="order-2">
            <JewelryViewerDynamic config={config} />
          </div>
        </div>
      )}
    </main>
  );
}
