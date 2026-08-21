import { NextResponse } from "next/server";
import { startGeneration } from "@/lib/generation/service";
import { rateLimit } from "@/lib/rate-limit";
import { startGenerationSchema } from "@/lib/validation/jewelry-request";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`generation-start:${ip}`, 12, 60_000);
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

  const parsed = startGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const job = await startGeneration({
      request: parsed.data.request,
      designId: parsed.data.designId,
      feedback: parsed.data.feedback,
    });

    return NextResponse.json({
      jobId: job.id,
      designId: job.designId,
      internalDesignCuid: job.internalDesignCuid,
      status: job.status,
      progressMessage: job.progressMessage,
      provider: job.provider,
    });
  } catch (error) {
    console.error("[api/generations]", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 },
    );
  }
}
