import type {
  AI3DGenerateInput,
  AI3DJobRef,
  AI3DJobStatus,
  AI3DProvider,
  AI3DResult,
  GenerationJobStatus,
  JewelryGenerationRequest,
  JewelryMetalPreference,
  JewelryStonePreference,
} from "@/lib/ai/types";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";

/**
 * Serverless-safe mock 3D provider.
 * Job timing is encoded in the job id — no in-memory Map (Vercel-safe).
 */
const MOCK_DELAY_MS = Number(process.env.AI3D_MOCK_DELAY_MS || 2500);

function parseJobCreatedAt(jobId: string): number {
  const match = /^mock_(\d+)_/.exec(jobId);
  if (match) return Number(match[1]);
  return Date.now() - MOCK_DELAY_MS;
}

function inferStone(prompt: string): JewelryStonePreference {
  const p = prompt.toLowerCase();
  if (p.includes("ruby")) return "ruby";
  if (p.includes("sapphire")) return "sapphire";
  if (p.includes("emerald")) return "emerald";
  if (p.includes("diamond") || p.includes("oval") || p.includes("brilliant")) {
    return "diamond";
  }
  return "diamond";
}

function inferMetal(prompt: string): JewelryMetalPreference {
  const p = prompt.toLowerCase();
  if (p.includes("rose")) return "rose_gold";
  if (p.includes("white gold")) return "white_gold";
  if (p.includes("platinum")) return "platinum";
  if (p.includes("silver")) return "silver";
  if (p.includes("yellow")) return "yellow_gold";
  return "rose_gold";
}

/** Pick a richer mock mesh so diamond rings show a center stone. */
export function resolveMockModelUrl(
  jewelryType: string,
  options?: {
    stone?: JewelryStonePreference | string | null;
    metal?: JewelryMetalPreference | string | null;
    prompt?: string;
  },
): string {
  if (jewelryType !== "ring") {
    return `/models/ai-mock/${jewelryType}.glb`;
  }

  const stone =
    (options?.stone as JewelryStonePreference | undefined) ||
    (options?.prompt ? inferStone(options.prompt) : "diamond");
  const metal =
    (options?.metal as JewelryMetalPreference | undefined) ||
    (options?.prompt ? inferMetal(options.prompt) : "rose_gold");

  if (stone === "ruby") return "/models/ai-mock/ring-ruby.glb";
  if (stone === "sapphire") return "/models/ai-mock/ring-sapphire.glb";
  if (stone === "emerald") return "/models/ai-mock/ring-emerald.glb";

  if (metal === "yellow_gold") return "/models/ai-mock/ring-diamond-yellow.glb";
  if (metal === "white_gold" || metal === "platinum" || metal === "silver") {
    return "/models/ai-mock/ring-diamond-white.glb";
  }
  return "/models/ai-mock/ring-diamond.glb";
}

export function resolveMockPreviewUrl(
  jewelryType: string,
  stone?: string | null,
): string {
  if (jewelryType === "ring" && (!stone || stone === "diamond" || stone === "any")) {
    return "/images/ai-placeholders/ring-diamond-concept.svg";
  }
  return `/images/ai-placeholders/${jewelryType}-concept.svg`;
}

function statusFromElapsed(elapsed: number): GenerationJobStatus {
  if (elapsed < MOCK_DELAY_MS * 0.35) return "QUEUED";
  if (elapsed < MOCK_DELAY_MS) return "PROCESSING";
  return "COMPLETED";
}

export class Mock3DProvider implements AI3DProvider {
  readonly id = "mock";
  readonly displayName = "Mock 3D Provider (development)";

  async generateFromText(input: AI3DGenerateInput): Promise<AI3DJobRef> {
    return this.enqueue(input);
  }

  async generateFromImage(input: AI3DGenerateInput): Promise<AI3DJobRef> {
    // Concept placeholders are fine for mock image-to-3D
    return this.enqueue(input);
  }

  async getJobStatus(jobId: string): Promise<AI3DJobStatus> {
    const createdAt = parseJobCreatedAt(jobId);
    const status = statusFromElapsed(Date.now() - createdAt);
    const messages: Record<GenerationJobStatus, string> = {
      QUEUED: "Understanding your design...",
      PROCESSING: "Building your 3D model...",
      COMPLETED: "Preparing your interactive preview...",
      FAILED: "Generation failed",
    };
    return {
      jobId,
      status,
      progressMessage: messages[status],
      provider: this.id,
    };
  }

  async getResult(jobId: string): Promise<AI3DResult | null> {
    const status = await this.getJobStatus(jobId);
    if (status.status !== "COMPLETED") return null;

    // Prefer prompt-encoded hints from job id suffix when present
    const promptHint = jobId.includes("__")
      ? decodeURIComponent(jobId.split("__")[1] || "")
      : "";

    const modelUrl = resolveMockModelUrl("ring", { prompt: promptHint });
    return {
      jobId,
      status: "COMPLETED",
      modelUrl,
      previewImageUrl: resolveMockPreviewUrl("ring"),
      provider: this.id,
      visualizationDisclaimer: VISUALIZATION_DISCLAIMER,
    };
  }

  private enqueue(input: AI3DGenerateInput): AI3DJobRef {
    const now = Date.now();
    const hint = encodeURIComponent(input.prompt.slice(0, 120));
    const jobId =
      input.clientJobId?.startsWith("mock_")
        ? input.clientJobId
        : `mock_${now}_${Math.random().toString(36).slice(2, 8)}__${hint}`;

    // Store jewelry type in a deterministic way for getResult — use prompt
    return { jobId, status: "QUEUED", provider: this.id };
  }
}

/** Resolve mock assets from a full customer request (used by generation service). */
export function resolveMockAssetsFromRequest(
  request: JewelryGenerationRequest,
  prompt: string,
): { modelUrl: string; previewUrl: string } {
  return {
    modelUrl: resolveMockModelUrl(request.jewelryType, {
      stone: request.stone,
      metal: request.metal,
      prompt,
    }),
    previewUrl: resolveMockPreviewUrl(request.jewelryType, request.stone),
  };
}
