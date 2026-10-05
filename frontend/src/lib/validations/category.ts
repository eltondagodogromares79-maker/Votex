import { z } from "zod";

export const createCategorySchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code is too long"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional().or(z.literal("")),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema;

export const createCriterionSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code is too long"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name is too long"),
  description: z.string().max(1000).optional().or(z.literal("")),
  defaultMaximumScore: z
    .string()
    .min(1, "Maximum score is required"),
  defaultMinimumScore: z
    .string()
    .min(1, "Minimum score is required"),
});

export const updateCriterionSchema = createCriterionSchema;

export type CreateCategoryFormValues  = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormValues  = z.infer<typeof updateCategorySchema>;
export type CreateCriterionFormValues = z.infer<typeof createCriterionSchema>;
export type UpdateCriterionFormValues = z.infer<typeof updateCriterionSchema>;
