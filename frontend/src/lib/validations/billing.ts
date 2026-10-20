import { z } from "zod";

const planSchema = z.enum(["basic", "premium", "enterprise"] as const);

export const manualPaymentSchema = z.object({
  plan: planSchema,
  quantity: z.number().int().min(1).optional(),
  reference_number: z.string().min(5, "Reference number must be at least 5 characters").max(100, "Reference number is too long"),
  screenshot_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  plan: planSchema,
  quantity: z.number().int().min(1).optional(),
});

export const reviewPaymentSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500, "Notes are too long").optional().or(z.literal("")),
});

export const contactSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject is too long"),
  message: z.string().min(20, "Message must be at least 20 characters").max(2000, "Message is too long"),
});

export type ManualPaymentFormValues = z.infer<typeof manualPaymentSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type ReviewPaymentFormValues = z.infer<typeof reviewPaymentSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
