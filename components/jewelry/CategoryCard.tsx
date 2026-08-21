import Link from "next/link";
import type { CategoryAvailability } from "@/types/jewelry";

export function CategoryCard({ category }: { category: CategoryAvailability }) {
  const content = (
    <article
      className={`group relative overflow-hidden border border-[var(--color-border)] bg-white/70 p-6 transition ${
        category.available
          ? "hover:border-[var(--color-gold)]"
          : "opacity-70"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--color-gold-soft)] opacity-60 transition group-hover:opacity-100"
        aria-hidden
      />
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-deep)]">
        {category.available ? "Available" : "Coming soon"}
      </p>
      <h3 className="mt-3 font-display text-2xl text-[var(--color-ink)]">
        {category.label}
      </h3>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{category.description}</p>
    </article>
  );

  if (!category.available) {
    return content;
  }

  return <Link href={category.href}>{content}</Link>;
}
