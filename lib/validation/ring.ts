import { z } from "zod";

export const ringConfigSchema = z.object({
  category: z.literal("ring"),
  modelSlug: z.string().min(1),
  metalCode: z.string().min(1),
  stoneCode: z.string().min(1),
  stoneCarats: z.number().min(0.1).max(20),
  ringSize: z.number().min(3).max(13),
  bandWidthMm: z.number().min(1.5).max(12),
  engraving: z.string().max(40).optional(),
  finish: z.enum(["polished", "matte", "brushed"]),
});

export type RingConfigInput = z.infer<typeof ringConfigSchema>;
