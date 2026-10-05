import { z } from "zod";

export const submitScoreSchema = z.object({
  candidate_id: z.string().uuid("Invalid candidate ID"),
  criterion_id: z.string().uuid("Invalid criterion ID"),
  value: z.number().int("Score must be a whole number").min(0, "Score cannot be less than 0").max(100, "Score cannot exceed 100"),
});

export type SubmitScoreFormValues = z.infer<typeof submitScoreSchema>;
