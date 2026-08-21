import { NextResponse } from "next/server";
import { selectDesignVersion } from "@/lib/generation/service";
import { rateLimit } from "@/lib/rate-limit";
import { selectVersionSchema } from "@/lib/validation/jewelry-request";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`select-version:${ip}`, 30, 60_000);
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

  const parsed = selectVersionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await selectDesignVersion(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to select version";
    const status =
      message.includes("not found") || message.includes("Version not found")
        ? 404
        : 500;
    console.error("[api/designs/select-version]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
