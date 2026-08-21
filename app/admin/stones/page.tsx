import { prisma } from "@/lib/database/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function AdminStonesPage() {
  const stones = await prisma.stone.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Stones</h1>
      <div className="overflow-x-auto border border-[var(--color-border)] bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-3">Swatch</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">$/ct</th>
            </tr>
          </thead>
          <tbody>
            {stones.map((stone) => (
              <tr key={stone.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-5 w-5 rounded-full border border-[var(--color-border)]"
                    style={{ backgroundColor: stone.colorHex }}
                  />
                </td>
                <td className="px-4 py-3">{stone.name}</td>
                <td className="px-4 py-3">{stone.code}</td>
                <td className="px-4 py-3">{stone.type}</td>
                <td className="px-4 py-3">
                  {formatCurrency(stone.pricePerCarat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
