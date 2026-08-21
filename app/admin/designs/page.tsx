import { prisma } from "@/lib/database/prisma";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { DesignStatusSelect } from "./DesignStatusSelect";

export default async function AdminDesignsPage() {
  const designs = await prisma.design.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, quotations: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Designs</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Review submissions and update status.
        </p>
      </div>
      <div className="overflow-x-auto border border-[var(--color-border)] bg-white/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {designs.map((design) => {
              const quotation = design.quotations[0];
              return (
                <tr key={design.id} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/design/${design.designId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {design.designId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{design.customer?.email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{design.jewelryType}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(design.total, design.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <DesignStatusSelect
                      designId={design.designId}
                      status={design.status}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {format(design.createdAt, "dd MMM yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    {quotation ? (
                      <Link
                        href={`/api/quotations/${quotation.id}/pdf`}
                        className="underline-offset-2 hover:underline"
                        target="_blank"
                      >
                        PDF
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
