import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/design", label: "Design" },
  { href: "/quotation", label: "Quotation" },
];

export function Header() {
  const brand = process.env.NEXT_PUBLIC_APP_NAME || "Maison Atelier";

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-cream)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-2xl tracking-wide text-[var(--color-ink)]">
          {brand}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-[var(--color-ink-muted)] sm:gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[var(--color-ink)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="rounded-sm border border-[var(--color-gold)] px-3 py-1.5 text-[var(--color-ink)] transition hover:bg-[var(--color-gold-soft)]"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
