"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateContestant } from "@/src/features/coordinator/hooks/useContestants";
import { createCandidateSchema } from "@/src/lib/validations/candidate";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

/**
 * Form schema – based on the API schema but tuned for the form:
 * - empty strings are allowed for optional fields
 * - photoUrl can be empty string or a valid URL
 * - no userId (not collected in this form)
 */
export const candidateFormSchema = createCandidateSchema
  .omit({ userId: true })
  .extend({
    middleName: z.string().max(100).optional(),
    displayName: z.string().max(250).optional(),
    gender: z.enum(["Male", "Female"], { error: "Choose Male or Female." }),
    photoUrl: z
      .string()
      .url("Please enter a valid photo URL.")
      .or(z.literal(""))
      .optional(),
    biography: z.string().max(2000).optional(),
  });

export type CandidateFormValues = z.infer<typeof candidateFormSchema>;

type AddCandidateModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
};

const DEFAULT_VALUES: Partial<CandidateFormValues> = {
  contestantNumber: undefined,
  firstName: "",
  middleName: "",
  lastName: "",
  displayName: "",
  photoUrl: "",
  biography: "",
};

// ─── Design tokens — auth page palette (matches org_owner modal conventions) ──

export const fieldLabel = "block text-small font-medium text-white/80 mb-1.5";
export const fieldInput = "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";
export const fieldError = "text-caption text-error mt-1";

export function Field({ label, error, children, hint }: { label: React.ReactNode; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      {children}
      {error && <p className={fieldError}>{error}</p>}
      {!error && hint && <p className="text-caption text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

export default function AddCandidateModal({
  pageantId,
  open,
  onClose,
}: AddCandidateModalProps) {
  const createContestant = useCreateContestant(pageantId);
  const { toast } = useToast();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  function handleClose() {
    if (createContestant.isPending || isUploadingPhoto) return;
    onClose();
  }

  async function onSubmit(data: CandidateFormValues) {
    try {
      await createContestant.mutateAsync({
        contestantNumber: data.contestantNumber,
        firstName: data.firstName.trim(),
        middleName: data.middleName?.trim() || null,
        lastName: data.lastName.trim(),
        displayName: data.displayName?.trim() || null,
        gender: data.gender?.trim() || null,
        photoUrl: data.photoUrl?.trim() || null,
        biography: data.biography?.trim() || null,
      });

      toast.success(`${data.firstName.trim()} ${data.lastName.trim()} added as a candidate.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to add candidate.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Candidate"
      description="Add a new contestant to this pageant."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={createContestant.isPending || isUploadingPhoto}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="add-candidate-form"
            type="submit"
            loading={createContestant.isPending}
          >
            Add Candidate
          </Button>
        </>
      }
    >
      <form id="add-candidate-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <Field label={<>Contestant Number <span className="text-error">*</span></>} error={errors.contestantNumber?.message}>
          <input
            type="number"
            min={1}
            placeholder="e.g. 1"
            disabled={createContestant.isPending}
            autoFocus
            {...register("contestantNumber", { valueAsNumber: true })}
            className={fieldInput}
          />
        </Field>

        <div className="space-y-4">
          <Field label={<>First Name <span className="text-error">*</span></>} error={errors.firstName?.message}>
            <input type="text" placeholder="First name" disabled={createContestant.isPending}
              {...register("firstName")} className={fieldInput} />
          </Field>
          <Field label="Middle Name" error={errors.middleName?.message}>
            <input type="text" placeholder="Middle name" disabled={createContestant.isPending}
              {...register("middleName")} className={fieldInput} />
          </Field>
          <Field label={<>Last Name <span className="text-error">*</span></>} error={errors.lastName?.message}>
            <input type="text" placeholder="Last name" disabled={createContestant.isPending}
              {...register("lastName")} className={fieldInput} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Display Name"
            error={errors.displayName?.message}
            hint="Leave blank to use the candidate's name."
          >
            <input type="text" placeholder="e.g. Maria Santos" disabled={createContestant.isPending}
              {...register("displayName")} className={fieldInput} />
          </Field>

          <Field label={<>Gender <span className="text-error">*</span></>} error={errors.gender?.message} hint="Category eligibility is set separately when you create a category.">
            <select disabled={createContestant.isPending} {...register("gender")} className={fieldInput}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
        </div>

        <Field label="Photo" error={errors.photoUrl?.message} hint="Optional. You can add a photo now or add it later.">
          <Controller
            control={control}
            name="photoUrl"
            render={({ field }) => (
              <CloudinaryImageUpload
                value={field.value}
                onChange={field.onChange}
                folder="contestant-photos"
                label="Upload photo"
                dark
                rounded
                onUploadingChange={setIsUploadingPhoto}
              />
            )}
          />
        </Field>

        <Field label="Biography" error={errors.biography?.message} hint="Optional. Maximum 2,000 characters.">
          <textarea
            rows={4}
            placeholder="Enter a short biography for the candidate..."
            disabled={createContestant.isPending}
            {...register("biography")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

      </form>
    </Modal>
  );
}
