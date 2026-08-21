import Link from "next/link";

export function Footer() {
  const brand = process.env.NEXT_PUBLIC_APP_NAME || "Maison Atelier";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-cream-deep)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--color-ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} {brand}. Bespoke jewelry, thoughtfully configured.
        </p>
        <div className="flex gap-4">
          <Link href="/design" className="hover:text-[var(--color-ink)]">
            Start a design
          </Link>
          <Link href="/admin/login" className="hover:text-[var(--color-ink)]">
            Studio login
          </Link>
        </div>
      </div>
    </footer>
  );
}
