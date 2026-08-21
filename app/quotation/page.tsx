"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QuotationView } from "@/components/quotation/QuotationView";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { Button } from "@/components/ui/Button";
import { useConfiguratorStore } from "@/store/configurator-store";
import { priceRingConfig } from "@/lib/pricing/engine";
import type { CustomerInput } from "@/lib/validation/customer";
import type { PricingBreakdown } from "@/types/pricing";

function safePricing(
  config: Parameters<typeof priceRingConfig>[0],
  existing: PricingBreakdown | null,
): PricingBreakdown | null {
  if (existing) return existing;
  try {
    return priceRingConfig(config);
  } catch (error) {
    console.error("[quotation] pricing failed", error);
    return null;
  }
}

export default function QuotationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const { config, pricing, getQuotationView, setSubmitted, setStep } =
    useConfiguratorStore();

  const resolvedPricing = useMemo(
    () => safePricing(config, pricing),
    [config, pricing],
  );

  const view = useMemo(() => {
    try {
      return getQuotationView();
    } catch {
      return null;
    }
  }, [getQuotationView]);

  async function handleSubmit(customer: CustomerInput) {
    if (!resolvedPricing) {
      setError("Unable to calculate pricing. Please edit your configuration.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          customer,
          pricing: resolvedPricing,
        }),
      });
      const data = (await res.json()) as {
        designId?: string;
        emailWarning?: boolean;
        error?: string;
      };
      if (!res.ok || !data.designId) {
        throw new Error(data.error || "Submission failed");
      }
      setSubmitted(data.designId, Boolean(data.emailWarning));
      router.push(`/submit?designId=${encodeURIComponent(data.designId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!resolvedPricing || !view) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl">Quotation unavailable</h1>
        <p className="mt-3 text-[var(--color-ink-muted)]">
          Your configuration could not be priced. Please return to the design
          studio and try again.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push("/design?category=ring")}
        >
          Back to design
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[var(--color-ink)]">
            Quotation
          </h1>
          <p className="mt-2 text-[var(--color-ink-muted)]">
            Review your estimate, then share your details to submit.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setStep("configure");
            router.push("/design?category=ring");
          }}
        >
          Edit configuration
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <QuotationView view={{ ...view, pricing: resolvedPricing }} />
        <div className="space-y-4">
          {!showCustomer ? (
            <div className="border border-[var(--color-border)] bg-white/80 p-6">
              <h2 className="font-display text-2xl">Ready to proceed?</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Provide contact details so the atelier can follow up on your
                design.
              </p>
              <Button className="mt-4" onClick={() => setShowCustomer(true)}>
                Continue with customer details
              </Button>
            </div>
          ) : (
            <div className="border border-[var(--color-border)] bg-white/80 p-6">
              <h2 className="font-display mb-4 text-2xl">Your details</h2>
              <CustomerForm onSubmit={handleSubmit} submitting={submitting} />
              {error ? (
                <p className="mt-3 text-sm text-red-700">{error}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
