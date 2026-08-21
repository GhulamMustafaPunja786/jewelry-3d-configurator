import { CategoryGrid } from "@/components/jewelry/CategoryGrid";

export function CategoriesPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-3xl text-[var(--color-ink)] sm:text-4xl">
          Collections
        </h2>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Rings are fully configurable today. Additional categories share the same
          architecture and will open soon.
        </p>
      </div>
      <CategoryGrid />
    </section>
  );
}
