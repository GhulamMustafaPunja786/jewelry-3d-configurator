import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { designSubmissionSchema } from "@/lib/validation/design";
import { generateDesignId, generateQuotationId } from "@/lib/design-id";
import { buildQuotationPdf } from "@/lib/pdf/quotation-pdf";
import { saveBuffer, saveDataUrlImage } from "@/lib/storage";
import { sendDesignNotification } from "@/lib/email";
import { sendWhatsAppStub } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { formatCurrency } from "@/lib/utils";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`design-submit:${ip}`, 10, 60_000);
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

  const parsed = designSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { config, customer, pricing, previewDataUrl, notes } = parsed.data;

  try {
    const designId = await generateDesignId();
    const quotationId = generateQuotationId(designId);

    const customerRecord = await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        country: customer.country,
        message: customer.message ?? notes,
      },
    });

    let previewPath: string | null = null;
    if (previewDataUrl) {
      previewPath = await saveDataUrlImage(
        `previews/${designId}`,
        previewDataUrl,
      );
    }

    const view = {
      designId,
      category: config.category,
      config,
      pricing,
      customer,
      terms: QUOTATION_TERMS,
      validDays: QUOTATION_VALID_DAYS,
    };

    const pdfBytes = await buildQuotationPdf(view);
    const pdfPath = await saveBuffer(
      `pdfs/${designId}.pdf`,
      Buffer.from(pdfBytes),
    );

    const design = await prisma.design.create({
      data: {
        designId,
        customerId: customerRecord.id,
        status: "NEW",
        jewelryType: config.category,
        configurationJson: JSON.stringify(config),
        modelReference: config.modelSlug,
        previewPath,
        pdfPath,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        currency: pricing.currency,
        items: {
          create: [
            {
              label: `${config.modelSlug} · ${config.metalCode} · ${config.stoneCode}`,
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
            termsJson: JSON.stringify(QUOTATION_TERMS),
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
      include: { quotations: true },
    });

    const emailResult = await sendDesignNotification({
      designId,
      customerEmail: customer.email,
      customerName: customer.name,
      totalLabel: formatCurrency(pricing.total, pricing.currency),
    });

    await sendWhatsAppStub(
      `New design ${designId} from ${customer.name} — ${formatCurrency(pricing.total, pricing.currency)}`,
    );

    const emailWarning = !emailResult.sent || Boolean(emailResult.warning);

    if (emailWarning) {
      await prisma.design.update({
        where: { id: design.id },
        data: { emailWarning: true },
      });
    }

    return NextResponse.json({
      designId,
      quotationId,
      emailWarning,
      warning: emailResult.warning,
    });
  } catch (error) {
    console.error("[api/designs]", error);
    return NextResponse.json(
      { error: "Failed to save design" },
      { status: 500 },
    );
  }
}
