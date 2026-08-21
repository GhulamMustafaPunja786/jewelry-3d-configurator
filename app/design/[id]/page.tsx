import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { QuotationView } from "@/components/quotation/QuotationView";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";
import type { RingConfig } from "@/types/jewelry";
import type { PricingBreakdown } from "@/types/pricing";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DesignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  const design = await prisma.design.findFirst({
    where: {
      OR: [{ designId: id }, { id }],
    },
    include: {
      customer: true,
      quotations: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  if (!design) notFound();

  // Private customer data requires admin session
  if (!session) {
    redirect(`/admin/login?next=/design/${encodeURIComponent(design.designId)}`);
  }

  const config = JSON.parse(design.configurationJson) as RingConfig;
  const quotation = design.quotations[0];
  const pricing = quotation
    ? (JSON.parse(quotation.breakdownJson) as PricingBreakdown)
    : {
        currency: design.currency,
        metalCost: 0,
        stoneCost: 0,
        laborCost: 0,
        makingCharge: 0,
        subtotal: design.subtotal,
        taxRate: design.subtotal ? design.tax / design.subtotal : 0,
        tax: design.tax,
        total: design.total,
        lines: [],
      };

  const view = {
    designId: design.designId,
    category: design.jewelryType,
    config,
    pricing,
    customer: design.customer
      ? {
          name: design.customer.name,
          email: design.customer.email,
          phone: design.customer.phone ?? undefined,
          country: design.customer.country ?? undefined,
          message: design.customer.message ?? undefined,
        }
      : undefined,
    terms: quotation?.termsJson
      ? (JSON.parse(quotation.termsJson) as string[])
      : QUOTATION_TERMS,
    validDays: QUOTATION_VALID_DAYS,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-deep)]">
            Status · {design.status}
          </p>
          <h1 className="font-display text-3xl">{design.designId}</h1>
        </div>
        {quotation ? (
          <Link href={`/api/quotations/${quotation.id}/pdf`} target="_blank">
            <Button variant="secondary">Download PDF</Button>
          </Link>
        ) : null}
      </div>
      <QuotationView view={view} showCustomer />
      {design.previewPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={design.previewPath}
          alt="Design preview"
          className="mt-6 w-full border border-[var(--color-border)]"
        />
      ) : null}
    </main>
  );
}
