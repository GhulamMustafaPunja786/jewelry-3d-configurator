import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [designs, customers, products, metals, stones] = await Promise.all([
    prisma.design.count(),
    prisma.customer.count(),
    prisma.jewelryProduct.count(),
    prisma.metal.count(),
    prisma.stone.count(),
  ]);

  const byStatus = await prisma.design.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const recent = await prisma.design.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });

  return NextResponse.json({
    counts: { designs, customers, products, metals, stones },
    byStatus: byStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
    recent,
  });
}
