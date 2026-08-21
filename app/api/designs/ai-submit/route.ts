import { NextResponse } from "next/server";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";
import type { JewelryGenerationRequest } from "@/lib/ai/types";
import { generateQuotationId } from "@/lib/design-id";
import { prisma } from "@/lib/database/prisma";
import { sendDesignNotification } from "@/lib/email";
import { sendWhatsAppStub } from "@/lib/notifications";
import { buildAiQuotationPdf } from "@/lib/pdf/quotation-pdf";
import { rateLimit } from "@/lib/rate-limit";
import { saveBuffer } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import { aiDesignSubmitSchema } from "@/lib/validation/jewelry-request";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`ai-design-submit:${ip}`, 10, 60_000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = aiDesignSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { designId, versionId, customer, pricing } = parsed.data;

  try {
    const design = await prisma.design.findFirst({
      where: {
        OR: [{ designId }, { id: designId }],
      },
      include: {
        versions: true,
      },
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const version = design.versions.find((v) => v.id === versionId);
    if (!version) {
      return NextResponse.json(
        { error: "Selected version not found" },
        { status: 400 },
      );
    }

    let requestPayload: JewelryGenerationRequest | null = null;
    if (design.requestJson) {
      try {
        requestPayload = JSON.parse(design.requestJson) as JewelryGenerationRequest;
      } catch {
        requestPayload = null;
      }
    }

    if (!requestPayload) {
      return NextResponse.json(
        { error: "Design is missing AI request data" },
        { status: 400 },
      );
    }

    const customerRecord = await prisma.customer.create({
      data: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone?.trim() || null,
        country: customer.country?.trim() || null,
        message: customer.message?.trim() || null,
      },
    });

    await prisma.designVersion.updateMany({
      where: { designId: design.id, selected: true },
      data: { selected: false },
    });
    await prisma.designVersion.update({
      where: { id: version.id },
      data: { selected: true },
    });

    const quotationId = generateQuotationId(design.designId);

    const pdfView = {
      designId: design.designId,
      category: design.jewelryType,
      request: requestPayload,
      pricing,
      customer,
      terms: [
        ...QUOTATION_TERMS,
        VISUALIZATION_DISCLAIMER,
        "This estimate is based on your design description and preferences — not final manufacturing CAD.",
      ],
      validDays: QUOTATION_VALID_DAYS,
      modelUrl: version.modelUrl,
    };

    let pdfPath: string | null = null;
    try {
      const pdfBytes = await buildAiQuotationPdf(pdfView);
      pdfPath = await saveBuffer(
        `pdfs/${design.designId}.pdf`,
        Buffer.from(pdfBytes),
        "application/pdf",
      );
    } catch (pdfError) {
      console.error("[api/designs/ai-submit] pdf generation failed", pdfError);
    }

    await prisma.design.update({
      where: { id: design.id },
      data: {
        customerId: customerRecord.id,
        status: "NEW",
        selectedVersionId: version.id,
        modelUrl: version.modelUrl,
        previewPath: version.imageUrl,
        pdfPath,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        currency: pricing.currency,
        items: {
          create: [
            {
              label: `AI ${design.jewelryType} · v${version.versionNumber}`,
              quantity: 1,
              unitPrice: pricing.subtotal,
              lineTotal: pricing.subtotal,
            },
          ],
        },
        quotations: {
          create: {
            quotationId,
            customerId: customerRecord.id,
            status: "PENDING",
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            total: pricing.total,
            currency: pricing.currency,
            breakdownJson: JSON.stringify(pricing),
            termsJson: JSON.stringify(pdfView.terms),
            pdfPath,
            items: {
              create: pricing.lines.map((line) => ({
                description: line.label,
                quantity: 1,
                unitPrice: line.amount,
                lineTotal: line.amount,
              })),
            },
          },
        },
      },
    });

    let emailWarning = true;
    let warning =
      "Email not configured — design saved without notification.";
    try {
      const emailResult = await sendDesignNotification({
        designId: design.designId,
        customerEmail: customer.email,
        customerName: customer.name,
        totalLabel: formatCurrency(pricing.total, pricing.currency),
      });
      emailWarning = !emailResult.sent || Boolean(emailResult.warning);
      warning = emailResult.warning ?? warning;
    } catch (emailError) {
      console.error("[api/designs/ai-submit] email failed", emailError);
    }

    try {
      await sendWhatsAppStub(
        `New AI design ${design.designId} from ${customer.name} — ${formatCurrency(pricing.total, pricing.currency)}`,
      );
    } catch (waError) {
      console.error("[api/designs/ai-submit] whatsapp stub failed", waError);
    }

    if (emailWarning) {
      await prisma.design.update({
        where: { id: design.id },
        data: { emailWarning: true },
      });
    }

    return NextResponse.json({
      designId: design.designId,
      quotationId,
      emailWarning,
      warning: emailWarning ? warning : undefined,
    });
  } catch (error) {
    console.error("[api/designs/ai-submit]", error);
    return NextResponse.json(
      { error: "Failed to submit AI design" },
      { status: 500 },
    );
  }
}
