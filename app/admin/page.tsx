import { prisma } from "@/lib/database/prisma";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [designCount, customerCount, productCount, recent] = await Promise.all([
    prisma.design.count(),
    prisma.customer.count(),
    prisma.jewelryProduct.count(),
    prisma.design.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
  ]);

  const cards = [
    { label: "Designs", value: designCount },
    { label: "Customers", value: customerCount },
    { label: "Products", value: productCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[var(--color-ink)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Atelier overview
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-[var(--color-border)] bg-white/80 p-5"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
              {card.label}
            </p>
            <p className="font-display mt-2 text-4xl">{card.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="font-display text-2xl">Recent designs</h2>
        <div className="mt-4 overflow-x-auto border border-[var(--color-border)] bg-white/80">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-3">Design</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((design) => (
                <tr key={design.id} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/designs`}
                      className="text-[var(--color-ink)] underline-offset-2 hover:underline"
                    >
                      {design.designId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{design.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3">{design.status}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(design.total, design.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {format(design.createdAt, "dd MMM yyyy")}
                  </td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-ink-muted)]">
                    No designs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
