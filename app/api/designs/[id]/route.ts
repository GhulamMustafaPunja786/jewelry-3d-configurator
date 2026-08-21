import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const design = await prisma.design.findFirst({
    where: { OR: [{ designId: id }, { id }] },
    include: {
      customer: true,
      items: true,
      quotations: { include: { items: true } },
    },
  });

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(design);
}
