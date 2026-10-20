import { z } from "zod";
export const createRoundSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name must be at most 150 characters"),
  roundNumber: z.number().int().min(1, "Round number must be at least 1"),
  roundType: z.string().trim().min(1, "Round type is required").max(100),
  advancementCount: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export const updateRoundSchema = z.object({
  name: z.string().min(1).max(150),
  roundNumber: z.number().int().min(1),
  roundType: z.string().trim().min(1).max(100),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "FINALIZED"]),
  advancementCount: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export type CreateRoundFormValues = z.infer<typeof createRoundSchema>;
export type UpdateRoundFormValues = z.infer<typeof updateRoundSchema>;
