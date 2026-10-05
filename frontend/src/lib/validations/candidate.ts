import { z } from "zod";

/** Validates the coordinator contestant create/update DTO. */
export const createCandidateSchema = z.object({
  contestantNumber: z.number().int().min(1),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).nullable().optional(),
  lastName: z.string().min(1).max(100),
  displayName: z.string().max(250).nullable().optional(),
  gender: z.string().max(50).nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  biography: z.string().nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
});

export const updateCandidateSchema = createCandidateSchema;

export type CreateCandidateFormValues = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateFormValues = z.infer<typeof updateCandidateSchema>;
