/**
 * Shared DTOs for generation jobs / versions (Phase 2 contracts).
 * Prisma models arrive in Phase 4.
 */

import type {
  GenerationJobStatus,
  JewelryGenerationRequest,
} from "@/lib/ai/types";

export type GenerationJobDTO = {
  id: string;
  status: GenerationJobStatus;
  provider: string;
  prompt: string;
  jewelryType: JewelryGenerationRequest["jewelryType"];
  referenceImageUrl?: string | null;
  conceptImageUrl?: string | null;
  modelUrl?: string | null;
  previewUrl?: string | null;
  error?: string | null;
  progressMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type DesignVersionDTO = {
  id: string;
  designId: string;
  versionNumber: number;
  prompt: string;
  imageUrl?: string | null;
  modelUrl?: string | null;
  selected: boolean;
  createdAt: string;
};
