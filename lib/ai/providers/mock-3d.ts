import type {
  AI3DGenerateInput,
  AI3DJobRef,
  AI3DJobStatus,
  AI3DProvider,
  AI3DResult,
  GenerationJobStatus,
} from "@/lib/ai/types";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";

type MockJob = {
  status: GenerationJobStatus;
  input: AI3DGenerateInput;
  createdAt: number;
  completedAt?: number;
  modelUrl?: string;
  previewImageUrl?: string;
  error?: string;
};

/**
 * In-memory mock 3D provider for UI development without GPU.
 * Serves a real GLB path from /models/ai-mock/ so Three.js can load a mesh
 * once assets exist. Never pretends this is Hunyuan output.
 */
const jobs = new Map<string, MockJob>();

const MOCK_DELAY_MS = Number(process.env.AI3D_MOCK_DELAY_MS || 2500);

function mockModelUrl(jewelryType: string): string {
  return `/models/ai-mock/${jewelryType}.glb`;
}

function mockPreviewUrl(jewelryType: string): string {
  return `/images/ai-placeholders/${jewelryType}-concept.svg`;
}

export class Mock3DProvider implements AI3DProvider {
  readonly id = "mock";
  readonly displayName = "Mock 3D Provider (development)";

  async generateFromText(input: AI3DGenerateInput): Promise<AI3DJobRef> {
    return this.enqueue(input);
  }

  async generateFromImage(input: AI3DGenerateInput): Promise<AI3DJobRef> {
    if (!input.conceptImageUrl && !input.referenceImageUrl) {
      const jobId = `mock_${Date.now()}_fail`;
      jobs.set(jobId, {
        status: "FAILED",
        input,
        createdAt: Date.now(),
        error: "Image-to-3D requires a concept or reference image URL.",
      });
      return { jobId, status: "FAILED", provider: this.id };
    }
    return this.enqueue(input);
  }

  async getJobStatus(jobId: string): Promise<AI3DJobStatus> {
    const job = jobs.get(jobId);
    if (!job) {
      return {
        jobId,
        status: "FAILED",
        error: "Unknown job id",
        provider: this.id,
      };
    }

    this.advance(jobId, job);

    const messages: Record<GenerationJobStatus, string> = {
      QUEUED: "Understanding your design...",
      PROCESSING: "Building your 3D model...",
      COMPLETED: "Preparing your interactive preview...",
      FAILED: job.error || "Generation failed",
    };

    return {
      jobId,
      status: job.status,
      progressMessage: messages[job.status],
      error: job.error,
      provider: this.id,
    };
  }

  async getResult(jobId: string): Promise<AI3DResult | null> {
    const job = jobs.get(jobId);
    if (!job) return null;
    this.advance(jobId, job);
    if (job.status !== "COMPLETED" || !job.modelUrl) return null;

    return {
      jobId,
      status: "COMPLETED",
      modelUrl: job.modelUrl,
      previewImageUrl: job.previewImageUrl,
      provider: this.id,
      visualizationDisclaimer: VISUALIZATION_DISCLAIMER,
    };
  }

  private enqueue(input: AI3DGenerateInput): AI3DJobRef {
    const jobId =
      input.clientJobId ||
      `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    jobs.set(jobId, {
      status: "QUEUED",
      input,
      createdAt: Date.now(),
    });
    return { jobId, status: "QUEUED", provider: this.id };
  }

  private advance(jobId: string, job: MockJob): void {
    if (job.status === "FAILED" || job.status === "COMPLETED") return;

    const elapsed = Date.now() - job.createdAt;
    if (elapsed < MOCK_DELAY_MS * 0.35) {
      job.status = "QUEUED";
      return;
    }
    if (elapsed < MOCK_DELAY_MS) {
      job.status = "PROCESSING";
      return;
    }

    job.status = "COMPLETED";
    job.completedAt = Date.now();
    job.modelUrl = mockModelUrl(job.input.jewelryType);
    job.previewImageUrl =
      job.input.conceptImageUrl ||
      job.input.referenceImageUrl ||
      mockPreviewUrl(job.input.jewelryType);
    jobs.set(jobId, job);
  }
}
