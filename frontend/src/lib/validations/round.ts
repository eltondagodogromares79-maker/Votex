import { z } from "zod";
import type { RoundType } from "@/src/types";

const ROUND_TYPES: [RoundType, ...RoundType[]] = [
  "PRELIMINARY",
  "SWIMWEAR",
  "FORMAL_WEAR",
  "TALENT",
  "QUESTION_AND_ANSWER",
  "FINAL",
  "CUSTOM",
];

export const createRoundSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name must be at most 150 characters"),
  roundNumber: z.number().int().min(1, "Round number must be at least 1"),
  roundType: z.enum(ROUND_TYPES, { message: "Please select a round type" }),
  advancementCount: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export const updateRoundSchema = z.object({
  name: z.string().min(1).max(150),
  roundNumber: z.number().int().min(1),
  roundType: z.enum(ROUND_TYPES),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "FINALIZED"]),
  advancementCount: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export type CreateRoundFormValues = z.infer<typeof createRoundSchema>;
export type UpdateRoundFormValues = z.infer<typeof updateRoundSchema>;
