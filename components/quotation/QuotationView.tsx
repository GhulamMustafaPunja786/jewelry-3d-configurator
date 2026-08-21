"use client";

import type { QuotationViewModel } from "@/types/design";
import { formatCurrency } from "@/lib/utils";

export function QuotationView({
  view,
  showCustomer,
}: {
  view: QuotationViewModel;
  showCustomer?: boolean;
}) {
  return (
    <div className="space-y-6 border border-[var(--color-border)] bg-white/80 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-deep)]">
          Quotation
        </p>
        <h2 className="font-display mt-1 text-3xl text-[var(--color-ink)]">
          {view.designId ?? "Draft estimate"}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Valid for {view.validDays} days · {view.category}
        </p>
      </div>

      {showCustomer && view.customer?.name ? (
        <div>
          <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
            Customer
          </h3>
          <p className="mt-1 text-[var(--color-ink)]">{view.customer.name}</p>
          {view.customer.email ? (
            <p className="text-sm text-[var(--color-ink-muted)]">
              {view.customer.email}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
          Configuration
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-[var(--color-ink)]">
          <li>Model: {view.config.modelSlug}</li>
          <li>Metal: {view.config.metalCode}</li>
          <li>
            Stone: {view.config.stoneCode} · {view.config.stoneCarats} ct
          </li>
          <li>
            Size {view.config.ringSize} · Band {view.config.bandWidthMm} mm ·{" "}
            {view.config.finish}
          </li>
          {view.config.engraving ? (
            <li>Engraving: {view.config.engraving}</li>
          ) : null}
        </ul>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
          Pricing
        </h3>
        <ul className="mt-2 space-y-2">
          {view.pricing.lines.map((line) => (
            <li
              key={line.key}
              className="flex items-center justify-between text-sm"
            >
              <span>{line.label}</span>
              <span>{formatCurrency(line.amount, view.pricing.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-[var(--color-border)] pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {formatCurrency(view.pricing.subtotal, view.pricing.currency)}
            </span>
          </div>
          <div className="flex justify-between text-[var(--color-ink-muted)]">
            <span>Tax ({Math.round(view.pricing.taxRate * 100)}%)</span>
            <span>
              {formatCurrency(view.pricing.tax, view.pricing.currency)}
            </span>
          </div>
          <div className="flex justify-between font-display text-2xl text-[var(--color-ink)]">
            <span>Total</span>
            <span>
              {formatCurrency(view.pricing.total, view.pricing.currency)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
          Terms
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--color-ink-muted)]">
          {view.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
