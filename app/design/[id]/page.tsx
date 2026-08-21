import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { QuotationView } from "@/components/quotation/QuotationView";
import { AiQuotationView } from "@/components/quotation/AiQuotationView";
import { GlbJewelryViewerDynamic } from "@/components/viewer/GlbJewelryViewerDynamic";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";
import type { JewelryGenerationRequest } from "@/lib/ai/types";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";
import type { RingConfig } from "@/types/jewelry";
import type { PricingBreakdown } from "@/types/pricing";
import { formatDesignStatus } from "@/types/design";
import { Button } from "@/components/ui/Button";

type PageProps = {
  params: Promise<{ id: string }>;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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
      versions: { orderBy: { versionNumber: "asc" } },
      selectedVersion: true,
    },
  });

  if (!design) notFound();

  if (!session) {
    redirect(`/admin/login?next=/design/${encodeURIComponent(design.designId)}`);
  }

  const aiRequest = design.requestJson
    ? parseJson<JewelryGenerationRequest | null>(design.requestJson, null)
    : null;
  const isAiDesign = Boolean(aiRequest);

  const config = parseJson<RingConfig>(design.configurationJson, {
    category: "ring",
    modelSlug: "solitaire-classic",
    metalCode: "AU18Y",
    stoneCode: "DIA-RD-FG-VS",
    stoneCarats: 1,
    ringSize: 7,
    bandWidthMm: 2.2,
    finish: "polished",
  });

  const quotation = design.quotations[0];
  const pricing = quotation
    ? parseJson<PricingBreakdown>(quotation.breakdownJson, {
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
      })
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

  const customer = design.customer
    ? {
        name: design.customer.name,
        email: design.customer.email,
        phone: design.customer.phone ?? undefined,
        country: design.customer.country ?? undefined,
        message: design.customer.message ?? undefined,
      }
    : undefined;

  const terms = quotation?.termsJson
    ? parseJson<string[]>(quotation.termsJson, QUOTATION_TERMS)
    : QUOTATION_TERMS;

  const modelUrl =
    design.selectedVersion?.modelUrl ??
    design.modelUrl ??
    design.versions.find((v) => v.selected)?.modelUrl ??
    design.versions[design.versions.length - 1]?.modelUrl ??
    null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-deep)]">
            Status · {formatDesignStatus(design.status)}
            {isAiDesign ? " · AI design" : ""}
          </p>
          <h1 className="font-display text-3xl">{design.designId}</h1>
          <p className="mt-1 text-sm capitalize text-[var(--color-ink-muted)]">
            {design.jewelryType}
          </p>
        </div>
        {quotation ? (
          <a
            href={`/api/quotations/${quotation.id}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary">Download PDF</Button>
          </a>
        ) : null}
      </div>

      {modelUrl ? (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-2xl">3D model</h2>
          <GlbJewelryViewerDynamic modelUrl={modelUrl} allowProceduralFallback />
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            {VISUALIZATION_DISCLAIMER}
          </p>
        </div>
      ) : null}

      {isAiDesign && aiRequest ? (
        <>
          <AiQuotationView
            view={{
              designId: design.designId,
              category: design.jewelryType,
              request: aiRequest,
              pricing,
              customer,
              terms,
              validDays: QUOTATION_VALID_DAYS,
            }}
            showCustomer
          />
          {design.versions.length > 0 ? (
            <div className="mt-8 border border-[var(--color-border)] bg-white/80 p-6">
              <h2 className="font-display text-2xl">Versions</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {design.versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">
                        Version {v.versionNumber}
                        {v.selected || design.selectedVersionId === v.id
                          ? " · selected"
                          : ""}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[var(--color-ink-muted)]">
                        {v.prompt}
                      </p>
                    </div>
                    {v.modelUrl ? (
                      <span className="text-xs text-[var(--color-ink-muted)]">
                        GLB ready
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <QuotationView
          view={{
            designId: design.designId,
            category: design.jewelryType,
            config,
            pricing,
            customer,
            terms,
            validDays: QUOTATION_VALID_DAYS,
          }}
          showCustomer
        />
      )}

      {design.previewPath && !modelUrl ? (
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
