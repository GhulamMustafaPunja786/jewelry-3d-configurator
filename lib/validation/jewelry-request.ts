import { z } from "zod";

export const jewelryRequestSchema = z.object({
  jewelryType: z.enum([
    "ring",
    "necklace",
    "chain",
    "pendant",
    "bracelet",
    "earrings",
  ]),
  description: z
    .string()
    .min(10, "Please describe your jewelry in a bit more detail")
    .max(2000),
  style: z
    .enum([
      "classic",
      "luxury",
      "minimal",
      "modern",
      "vintage",
      "royal",
      "custom",
    ])
    .optional(),
  metal: z
    .enum([
      "yellow_gold",
      "white_gold",
      "rose_gold",
      "platinum",
      "silver",
      "any",
    ])
    .optional(),
  stone: z
    .enum(["diamond", "ruby", "sapphire", "emerald", "any"])
    .optional(),
  budget: z
    .enum([
      "under_500",
      "500_1000",
      "1000_2500",
      "2500_5000",
      "5000_plus",
      "unspecified",
    ])
    .optional(),
  additionalRequirements: z.string().max(1000).optional(),
  referenceImageUrl: z.string().max(5000).optional().nullable(),
});

export type JewelryRequestInput = z.infer<typeof jewelryRequestSchema>;

export const startGenerationSchema = z.object({
  request: jewelryRequestSchema,
  /** Existing draft design public id for regenerate */
  designId: z.string().optional(),
  feedback: z.string().max(1000).optional(),
});

export const selectVersionSchema = z.object({
  designId: z.string().min(1),
  versionId: z.string().min(1),
});

export const aiDesignSubmitSchema = z.object({
  designId: z.string().min(1),
  versionId: z.string().min(1),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    country: z.string().max(80).optional(),
    message: z.string().max(1000).optional(),
  }),
  pricing: z.object({
    currency: z.string().min(1),
    metalCost: z.number(),
    stoneCost: z.number(),
    laborCost: z.number(),
    makingCharge: z.number(),
    subtotal: z.number(),
    taxRate: z.number(),
    tax: z.number(),
    total: z.number(),
    lines: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        amount: z.number(),
      }),
    ),
  }),
});

export type AiDesignSubmitInput = z.infer<typeof aiDesignSubmitSchema>;
