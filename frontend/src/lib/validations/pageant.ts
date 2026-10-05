import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createPageantSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug is too long")
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(1000, "Description is too long").optional().or(z.literal("")),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional().or(z.literal("")),
  timezone: z.string().optional(),
});

export const updatePageantSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  startsAt: z.string().optional(),
  endsAt: z.string().optional().or(z.literal("")),
  timezone: z.string().optional(),
});

export type CreatePageantFormValues = z.infer<typeof createPageantSchema>;
export type UpdatePageantFormValues = z.infer<typeof updatePageantSchema>;
