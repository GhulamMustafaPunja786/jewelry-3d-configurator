import { prisma } from "@/lib/database/prisma";
import { format } from "date-fns";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { designs: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Customers</h1>
      <div className="overflow-x-auto border border-[var(--color-border)] bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Designs</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone ?? "—"}</td>
                <td className="px-4 py-3">{c.country ?? "—"}</td>
                <td className="px-4 py-3">{c._count.designs}</td>
                <td className="px-4 py-3">{format(c.createdAt, "dd MMM yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
