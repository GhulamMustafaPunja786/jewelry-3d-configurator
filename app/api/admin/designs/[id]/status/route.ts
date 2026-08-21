import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { designStatusSchema } from "@/lib/validation/design";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  status: designStatusSchema,
});

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const design = await prisma.design.findFirst({
    where: { OR: [{ id }, { designId: id }] },
  });
  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.design.update({
    where: { id: design.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
