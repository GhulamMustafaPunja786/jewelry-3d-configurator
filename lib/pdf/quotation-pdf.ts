import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";
import type { JewelryGenerationRequest } from "@/lib/ai/types";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";
import type { QuotationViewModel } from "@/types/design";
import type { PricingBreakdown } from "@/types/pricing";
import type { CustomerInfo } from "@/types/design";
import { formatCurrency } from "@/lib/utils";

export type AiQuotationPdfView = {
  designId: string;
  category: string;
  request: JewelryGenerationRequest;
  pricing: PricingBreakdown;
  customer?: Partial<CustomerInfo>;
  terms: string[];
  validDays: number;
  modelUrl?: string | null;
};

function pdfSafe(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, 500);
}

export async function buildQuotationPdf(
  view: QuotationViewModel & { designId: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 790;
  const ink = rgb(0.12, 0.1, 0.08);
  const muted = rgb(0.4, 0.36, 0.32);
  const gold = rgb(0.7, 0.55, 0.25);

  const draw = (
    text: string,
    size: number,
    bold = false,
    color = ink,
  ) => {
    page.drawText(pdfSafe(text), {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  draw(process.env.NEXT_PUBLIC_APP_NAME || "Maison Atelier", 22, true, gold);
  y -= 28;
  draw("Jewelry Design Quotation", 14, true);
  y -= 22;
  draw(`Design ID: ${view.designId}`, 11);
  y -= 16;
  draw(`Issued: ${format(new Date(), "dd MMM yyyy")}`, 10, false, muted);
  y -= 16;
  draw(`Valid for ${view.validDays} days`, 10, false, muted);
  y -= 28;

  if (view.customer?.name) {
    draw("Customer", 12, true);
    y -= 16;
    draw(view.customer.name, 11);
    y -= 14;
    if (view.customer.email) {
      draw(view.customer.email, 10, false, muted);
      y -= 14;
    }
    if (view.customer.phone) {
      draw(view.customer.phone, 10, false, muted);
      y -= 14;
    }
    if (view.customer.country) {
      draw(view.customer.country, 10, false, muted);
      y -= 14;
    }
    y -= 12;
  }

  draw("Configuration", 12, true);
  y -= 16;
  const configLines = [
    `Model: ${view.config.modelSlug}`,
    `Metal: ${view.config.metalCode}`,
    `Stone: ${view.config.stoneCode} (${view.config.stoneCarats} ct)`,
    `Ring size: ${view.config.ringSize}`,
    `Band width: ${view.config.bandWidthMm} mm`,
    `Finish: ${view.config.finish}`,
  ];
  if (view.config.engraving) {
    configLines.push(`Engraving: ${view.config.engraving}`);
  }
  for (const line of configLines) {
    draw(line, 10);
    y -= 14;
  }

  y -= 10;
  draw("Pricing", 12, true);
  y -= 16;
  for (const line of view.pricing.lines) {
    const left = pdfSafe(line.label);
    const right = pdfSafe(formatCurrency(line.amount, view.pricing.currency));
    page.drawText(left, { x: margin, y, size: 10, font, color: ink });
    page.drawText(right, {
      x: 595 - margin - font.widthOfTextAtSize(right, 10),
      y,
      size: 10,
      font,
      color: ink,
    });
    y -= 14;
  }

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595 - margin, y },
    thickness: 0.5,
    color: gold,
  });
  y -= 18;

  const totals = [
    ["Subtotal", view.pricing.subtotal],
    [`Tax (${Math.round(view.pricing.taxRate * 100)}%)`, view.pricing.tax],
    ["Total", view.pricing.total],
  ] as const;

  for (const [label, amount] of totals) {
    const right = pdfSafe(formatCurrency(amount, view.pricing.currency));
    const size = label === "Total" ? 12 : 10;
    page.drawText(pdfSafe(label), {
      x: margin,
      y,
      size,
      font: label === "Total" ? fontBold : font,
      color: ink,
    });
    page.drawText(right, {
      x: 595 - margin - font.widthOfTextAtSize(right, size),
      y,
      size,
      font: label === "Total" ? fontBold : font,
      color: ink,
    });
    y -= 16;
  }

  y -= 20;
  draw("Terms", 12, true);
  y -= 16;
  for (const term of view.terms) {
    const wrapped = wrapText(pdfSafe(term), 90);
    for (const w of wrapped) {
      if (y < 60) break;
      draw(w, 8, false, muted);
      y -= 11;
    }
    y -= 4;
  }

  return doc.save();
}

/**
 * PDF for AI jewelry requests — prints description/preferences + estimate disclaimer.
 * Does not claim manufacturing CAD accuracy.
 */
export async function buildAiQuotationPdf(
  view: AiQuotationPdfView,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 790;
  const ink = rgb(0.12, 0.1, 0.08);
  const muted = rgb(0.4, 0.36, 0.32);
  const gold = rgb(0.7, 0.55, 0.25);

  const draw = (
    text: string,
    size: number,
    bold = false,
    color = ink,
  ) => {
    page.drawText(pdfSafe(text), {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  draw(process.env.NEXT_PUBLIC_APP_NAME || "Maison Atelier", 22, true, gold);
  y -= 28;
  draw("AI Jewelry Design Estimate", 14, true);
  y -= 22;
  draw(`Design ID: ${view.designId}`, 11);
  y -= 16;
  draw(`Issued: ${format(new Date(), "dd MMM yyyy")}`, 10, false, muted);
  y -= 16;
  draw(`Valid for ${view.validDays} days`, 10, false, muted);
  y -= 28;

  if (view.customer?.name) {
    draw("Customer", 12, true);
    y -= 16;
    draw(view.customer.name, 11);
    y -= 14;
    if (view.customer.email) {
      draw(view.customer.email, 10, false, muted);
      y -= 14;
    }
    if (view.customer.phone) {
      draw(view.customer.phone, 10, false, muted);
      y -= 14;
    }
    if (view.customer.country) {
      draw(view.customer.country, 10, false, muted);
      y -= 14;
    }
    y -= 12;
  }

  draw("Design request", 12, true);
  y -= 16;
  const requestLines = [
    `Type: ${view.request.jewelryType}`,
    `Style: ${view.request.style ?? "unspecified"}`,
    `Metal preference: ${view.request.metal ?? "any"}`,
    `Stone preference: ${view.request.stone ?? "any"}`,
    `Budget band: ${view.request.budget ?? "unspecified"}`,
  ];
  for (const line of requestLines) {
    draw(line, 10);
    y -= 14;
  }

  y -= 6;
  draw("Description", 11, true);
  y -= 14;
  for (const w of wrapText(pdfSafe(view.request.description), 90)) {
    if (y < 120) break;
    draw(w, 10);
    y -= 13;
  }

  if (view.request.additionalRequirements?.trim()) {
    y -= 8;
    draw("Additional requirements", 11, true);
    y -= 14;
    for (const w of wrapText(
      pdfSafe(view.request.additionalRequirements),
      90,
    )) {
      if (y < 120) break;
      draw(w, 10);
      y -= 13;
    }
  }

  if (view.modelUrl) {
    y -= 8;
    draw(`Model reference: ${view.modelUrl}`, 8, false, muted);
    y -= 12;
  }

  y -= 10;
  draw("Estimated pricing", 12, true);
  y -= 16;
  for (const line of view.pricing.lines) {
    const left = pdfSafe(line.label);
    const right = pdfSafe(formatCurrency(line.amount, view.pricing.currency));
    page.drawText(left, { x: margin, y, size: 10, font, color: ink });
    page.drawText(right, {
      x: 595 - margin - font.widthOfTextAtSize(right, 10),
      y,
      size: 10,
      font,
      color: ink,
    });
    y -= 14;
  }

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595 - margin, y },
    thickness: 0.5,
    color: gold,
  });
  y -= 18;

  const totals = [
    ["Subtotal", view.pricing.subtotal],
    [`Tax (${Math.round(view.pricing.taxRate * 100)}%)`, view.pricing.tax],
    ["Total (estimate)", view.pricing.total],
  ] as const;

  for (const [label, amount] of totals) {
    const right = pdfSafe(formatCurrency(amount, view.pricing.currency));
    const size = label.startsWith("Total") ? 12 : 10;
    page.drawText(pdfSafe(label), {
      x: margin,
      y,
      size,
      font: label.startsWith("Total") ? fontBold : font,
      color: ink,
    });
    page.drawText(right, {
      x: 595 - margin - font.widthOfTextAtSize(right, size),
      y,
      size,
      font: label.startsWith("Total") ? fontBold : font,
      color: ink,
    });
    y -= 16;
  }

  y -= 16;
  draw("Disclaimer", 12, true);
  y -= 14;
  for (const w of wrapText(pdfSafe(VISUALIZATION_DISCLAIMER), 90)) {
    if (y < 80) break;
    draw(w, 8, false, muted);
    y -= 11;
  }

  y -= 12;
  draw("Terms", 12, true);
  y -= 16;
  for (const term of view.terms) {
    const wrapped = wrapText(pdfSafe(term), 90);
    for (const w of wrapped) {
      if (y < 60) break;
      draw(w, 8, false, muted);
      y -= 11;
    }
    y -= 4;
  }

  return doc.save();
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}
