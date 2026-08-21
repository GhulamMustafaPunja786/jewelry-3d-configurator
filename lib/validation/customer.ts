import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.string().email("Valid email required"),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  message: z.string().max(1000).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

/** Normalize empty strings from forms before persistence. */
export function normalizeCustomer(input: CustomerInput): CustomerInput {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || undefined,
    country: input.country?.trim() || undefined,
    message: input.message?.trim() || undefined,
  };
}
