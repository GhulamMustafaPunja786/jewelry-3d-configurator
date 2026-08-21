import { format } from "date-fns";
import { prisma } from "@/lib/database/prisma";

export async function generateDesignId(date = new Date()): Promise<string> {
  const day = format(date, "yyyyMMdd");
  const prefix = `JWL-${day}-`;

  const latest = await prisma.design.findFirst({
    where: { designId: { startsWith: prefix } },
    orderBy: { designId: "desc" },
    select: { designId: true },
  });

  let next = 1;
  if (latest?.designId) {
    const tail = latest.designId.slice(prefix.length);
    const parsed = Number.parseInt(tail, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }

  return `${prefix}${String(next).padStart(5, "0")}`;
}

export function generateQuotationId(designId: string): string {
  return designId.replace(/^JWL-/, "QTN-");
}
