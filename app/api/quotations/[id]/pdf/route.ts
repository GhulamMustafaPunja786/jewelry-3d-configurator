import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { readUploadFile } from "@/lib/storage";
import { buildQuotationPdf } from "@/lib/pdf/quotation-pdf";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";
import type { RingConfig } from "@/types/jewelry";
import type { PricingBreakdown } from "@/types/pricing";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const quotation = await prisma.quotation.findFirst({
    where: { OR: [{ id }, { quotationId: id }] },
    include: {
      design: true,
      customer: true,
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (quotation.pdfPath) {
    const existing = await readUploadFile(quotation.pdfPath);
    if (existing) {
      return new NextResponse(new Uint8Array(existing), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${quotation.quotationId}.pdf"`,
        },
      });
    }
  }

  const config = JSON.parse(quotation.design.configurationJson) as RingConfig;
  const pricing = JSON.parse(quotation.breakdownJson) as PricingBreakdown;
  const pdf = await buildQuotationPdf({
    designId: quotation.design.designId,
    category: quotation.design.jewelryType,
    config,
    pricing,
    customer: quotation.customer
      ? {
          name: quotation.customer.name,
          email: quotation.customer.email,
          phone: quotation.customer.phone ?? undefined,
          country: quotation.customer.country ?? undefined,
        }
      : undefined,
    terms: quotation.termsJson
      ? (JSON.parse(quotation.termsJson) as string[])
      : QUOTATION_TERMS,
    validDays: QUOTATION_VALID_DAYS,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quotation.quotationId}.pdf"`,
    },
  });
}
