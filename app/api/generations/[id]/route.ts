import { NextResponse } from "next/server";
import { pollAndSyncJob } from "@/lib/generation/service";
import { prisma } from "@/lib/database/prisma";
import { rateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ip = _request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`generation-poll:${ip}`, 60, 60_000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  try {
    const exists = await prisma.generationJob.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = await pollAndSyncJob(id);

    let versions: Array<{
      id: string;
      versionNumber: number;
      modelUrl: string | null;
      previewUrl: string | null;
      prompt: string;
      selected: boolean;
    }> = [];

    if (job.internalDesignCuid) {
      const rows = await prisma.designVersion.findMany({
        where: { designId: job.internalDesignCuid },
        orderBy: { versionNumber: "asc" },
      });
      versions = rows.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        modelUrl: v.modelUrl,
        previewUrl: v.imageUrl,
        prompt: v.prompt,
        selected: v.selected,
      }));
    }

    return NextResponse.json({
      jobId: job.id,
      designId: job.designId,
      internalDesignCuid: job.internalDesignCuid,
      status: job.status,
      progressMessage: job.progressMessage,
      error: job.error,
      modelUrl: job.modelUrl,
      previewUrl: job.previewUrl,
      provider: job.provider,
      version: job.version,
      versions,
    });
  } catch (error) {
    console.error("[api/generations/:id]", error);
    return NextResponse.json(
      { error: "Failed to poll generation job" },
      { status: 500 },
    );
  }
}
