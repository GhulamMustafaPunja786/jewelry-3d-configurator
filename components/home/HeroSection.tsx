import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const brand = process.env.NEXT_PUBLIC_APP_NAME || "Maison Atelier";

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)]">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(250,247,240,0.9),rgba(245,240,230,1))]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
        <p className="mb-4 text-xs uppercase tracking-[0.28em] text-[var(--color-gold-deep)]">
          Private atelier configurator
        </p>
        <h1 className="font-display max-w-3xl text-5xl leading-[1.05] text-[var(--color-ink)] sm:text-6xl md:text-7xl">
          {brand}
        </h1>
        <p className="mt-5 max-w-xl text-base text-[var(--color-ink-muted)] sm:text-lg">
          Compose a ring in three dimensions, receive an instant studio quotation,
          and submit your design for craftsmanship.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/design?category=ring">
            <Button>Configure a ring</Button>
          </Link>
          <Link href="/design">
            <Button variant="secondary">Browse categories</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
