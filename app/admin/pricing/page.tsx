import { prisma } from "@/lib/database/prisma";

export default async function AdminPricingPage() {
  const rules = await prisma.pricingRule.findMany({
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Pricing rules</h1>
      <div className="overflow-x-auto border border-[var(--color-border)] bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Priority</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-[var(--color-border)]">
                <td className="px-4 py-3">
                  <div>{rule.name}</div>
                  {rule.description ? (
                    <div className="text-xs text-[var(--color-ink-muted)]">
                      {rule.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{rule.category ?? "all"}</td>
                <td className="px-4 py-3">
                  {rule.ruleType} / {rule.valueType}
                </td>
                <td className="px-4 py-3">{rule.value}</td>
                <td className="px-4 py-3">{rule.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
