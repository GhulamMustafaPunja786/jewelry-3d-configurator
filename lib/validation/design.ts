import { z } from "zod";
import { customerSchema } from "./customer";
import { ringConfigSchema } from "./ring";

export const pricingBreakdownSchema = z.object({
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
      meta: z
        .record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.null()]),
        )
        .optional(),
    }),
  ),
});

export const designSubmissionSchema = z.object({
  config: ringConfigSchema,
  customer: customerSchema,
  pricing: pricingBreakdownSchema,
  previewDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, "Invalid preview image")
    .optional(),
  notes: z.string().max(1000).optional(),
});

export type DesignSubmissionInput = z.infer<typeof designSubmissionSchema>;

export const designStatusSchema = z.enum([
  "DRAFT",
  "NEW",
  "IN_REVIEW",
  "UNDER_REVIEW",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);
