/**
 * AI generation contracts for Maison Atelier.
 * Implementations live under lib/ai/providers and the separate ai-service/.
 * No secrets belong in this file.
 */

/** Async job lifecycle for image / 3D generation */
export type GenerationJobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type JewelryRequestType =
  | "ring"
  | "necklace"
  | "chain"
  | "pendant"
  | "bracelet"
  | "earrings";

export type JewelryStyleOption =
  | "classic"
  | "luxury"
  | "minimal"
  | "modern"
  | "vintage"
  | "royal"
  | "custom";

export type JewelryMetalPreference =
  | "yellow_gold"
  | "white_gold"
  | "rose_gold"
  | "platinum"
  | "silver"
  | "any";

export type JewelryStonePreference =
  | "diamond"
  | "ruby"
  | "sapphire"
  | "emerald"
  | "any";

export type JewelryBudgetBand =
  | "under_500"
  | "500_1000"
  | "1000_2500"
  | "2500_5000"
  | "5000_plus"
  | "unspecified";

/** Simple customer-facing request (not procedural ring params) */
export type JewelryGenerationRequest = {
  jewelryType: JewelryRequestType;
  description: string;
  style?: JewelryStyleOption;
  metal?: JewelryMetalPreference;
  stone?: JewelryStonePreference;
  budget?: JewelryBudgetBand;
  additionalRequirements?: string;
  /** Local path or data URL — never a secret */
  referenceImageUrl?: string | null;
};

export type BuiltJewelryPrompt = {
  /** Internal prompt for concept / image / 3D stages */
  prompt: string;
  negativePrompt: string;
  jewelryType: JewelryRequestType;
  metadata: Record<string, string>;
};

export type ImageGenerationInput = {
  prompt: string;
  negativePrompt?: string;
  jewelryType: JewelryRequestType;
  referenceImageUrl?: string | null;
  width?: number;
  height?: number;
};

export type ImageGenerationResult = {
  available: boolean;
  imageUrl?: string;
  provider: string;
  warning?: string;
};

/** Provider-agnostic 3D generation start */
export type AI3DGenerateInput = {
  prompt: string;
  negativePrompt?: string;
  jewelryType: JewelryRequestType;
  /** Concept image URL/path when doing image-to-3D */
  conceptImageUrl?: string | null;
  referenceImageUrl?: string | null;
  /** Correlation id from Next.js job record */
  clientJobId?: string;
};

export type AI3DJobRef = {
  jobId: string;
  status: GenerationJobStatus;
  provider: string;
};

export type AI3DJobStatus = {
  jobId: string;
  status: GenerationJobStatus;
  progressMessage?: string;
  error?: string;
  provider: string;
};

export type AI3DResult = {
  jobId: string;
  status: "COMPLETED";
  /** Absolute or app-relative URL to a real GLB/GLTF mesh */
  modelUrl: string;
  previewImageUrl?: string;
  provider: string;
  /** Visualization only — not manufacturing CAD */
  visualizationDisclaimer: string;
};

export const VISUALIZATION_DISCLAIMER =
  "AI-generated visualization. Final dimensions, materials and manufacturing specifications require confirmation by our jewelry specialists.";

/**
 * Pluggable 3D backend (Hunyuan3D-2, mock, future TRELLIS, etc.)
 * Next.js talks to these over HTTP; models are NOT bundled in the web app.
 */
export interface AI3DProvider {
  readonly id: string;
  readonly displayName: string;

  generateFromText(input: AI3DGenerateInput): Promise<AI3DJobRef>;
  generateFromImage(input: AI3DGenerateInput): Promise<AI3DJobRef>;
  getJobStatus(jobId: string): Promise<AI3DJobStatus>;
  getResult(jobId: string): Promise<AI3DResult | null>;
}

export interface JewelryImageGenerator {
  readonly id: string;
  generateJewelryConcept(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult>;
}

/** Legacy text-suggest adapter (kept for compatibility; not the primary flow) */
export type AiSuggestionRequest = {
  category: string;
  prompt: string;
  currentConfig?: Record<string, unknown>;
};

export type AiSuggestionResult = {
  available: boolean;
  suggestions?: string[];
  warning?: string;
};

export type AiAdapter = {
  suggest: (request: AiSuggestionRequest) => Promise<AiSuggestionResult>;
};

export const noopAiAdapter: AiAdapter = {
  async suggest(): Promise<AiSuggestionResult> {
    return {
      available: false,
      warning: "AI suggestion provider not configured.",
    };
  },
};
