import type {
  AI3DGenerateInput,
  AI3DJobRef,
  AI3DJobStatus,
  AI3DProvider,
  AI3DResult,
  GenerationJobStatus,
} from "@/lib/ai/types";
import { VISUALIZATION_DISCLAIMER } from "@/lib/ai/types";

type ServiceJobResponse = {
  job_id: string;
  status: string;
  progress_message?: string;
  error?: string;
  model_url?: string;
  preview_image_url?: string;
};

function mapStatus(status: string): GenerationJobStatus {
  const normalized = status.toUpperCase();
  if (normalized === "QUEUED" || normalized === "PENDING") return "QUEUED";
  if (normalized === "PROCESSING" || normalized === "RUNNING") return "PROCESSING";
  if (normalized === "COMPLETED" || normalized === "SUCCEEDED") return "COMPLETED";
  return "FAILED";
}

/**
 * HTTP client for the local Hunyuan3D-2 Python service (ai-service/).
 * Does not embed model weights. Requires AI3D_API_URL.
 */
export class Hunyuan3DProvider implements AI3DProvider {
  readonly id = "hunyuan";
  readonly displayName = "Hunyuan3D-2 (local service)";

  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl = process.env.AI3D_API_URL || "http://localhost:8080",
    timeoutMs = Number(process.env.AI3D_TIMEOUT || 300_000),
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
  }

  async generateFromText(input: AI3DGenerateInput): Promise<AI3DJobRef> {
    return this.start("/generate", {
      mode: "text",
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      jewelry_type: input.jewelryType,
      reference_image: input.referenceImageUrl ?? null,
      client_job_id: input.clientJobId,
    });
  }

  async generateFromImage(input: AI3DGenerateInput): Promise<AI3DJobRef> {
    const image = input.conceptImageUrl || input.referenceImageUrl;
    if (!image) {
      return {
        jobId: `hunyuan_missing_image_${Date.now()}`,
        status: "FAILED",
        provider: this.id,
      };
    }

    return this.start("/generate", {
      mode: "image",
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      jewelry_type: input.jewelryType,
      reference_image: image,
      concept_image: input.conceptImageUrl ?? null,
      client_job_id: input.clientJobId,
    });
  }

  async getJobStatus(jobId: string): Promise<AI3DJobStatus> {
    try {
      const data = await this.fetchJson<ServiceJobResponse>(
        `/jobs/${encodeURIComponent(jobId)}`,
        { method: "GET" },
      );
      return {
        jobId: data.job_id || jobId,
        status: mapStatus(data.status),
        progressMessage: data.progress_message,
        error: data.error,
        provider: this.id,
      };
    } catch (error) {
      return {
        jobId,
        status: "FAILED",
        error:
          error instanceof Error
            ? error.message
            : "Hunyuan3D service unavailable",
        provider: this.id,
      };
    }
  }

  async getResult(jobId: string): Promise<AI3DResult | null> {
    const status = await this.getJobStatus(jobId);
    if (status.status !== "COMPLETED") return null;

    try {
      const data = await this.fetchJson<ServiceJobResponse>(
        `/jobs/${encodeURIComponent(jobId)}/result`,
        { method: "GET" },
      );
      if (!data.model_url) return null;

      return {
        jobId: data.job_id || jobId,
        status: "COMPLETED",
        modelUrl: data.model_url,
        previewImageUrl: data.preview_image_url,
        provider: this.id,
        visualizationDisclaimer: VISUALIZATION_DISCLAIMER,
      };
    } catch {
      return null;
    }
  }

  private async start(
    path: string,
    body: Record<string, unknown>,
  ): Promise<AI3DJobRef> {
    try {
      const data = await this.fetchJson<ServiceJobResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      return {
        jobId: data.job_id,
        status: mapStatus(data.status),
        provider: this.id,
      };
    } catch (error) {
      const jobId = `hunyuan_error_${Date.now()}`;
      return {
        jobId,
        status: "FAILED",
        provider: this.id,
      };
    }
  }

  private async fetchJson<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Hunyuan3D HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
