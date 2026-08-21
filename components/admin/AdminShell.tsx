"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/designs", label: "Designs" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/metals", label: "Metals" },
  { href: "/admin/stones", label: "Stones" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        <p className="font-display text-xl text-[var(--color-ink)]">Studio</p>
        <nav className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-sm px-3 py-2 text-sm transition",
                pathname === link.href
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-gold-soft)] hover:text-[var(--color-ink)]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post" className="mt-6">
          <button
            type="submit"
            className="text-sm text-[var(--color-ink-muted)] underline-offset-2 hover:underline"
          >
            Sign out
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
