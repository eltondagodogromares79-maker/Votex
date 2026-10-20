"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateContestant } from "@/src/features/coordinator/hooks/useContestants";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { CandidateResponse } from "@/src/types";
import {
  candidateFormSchema,
  Field,
  fieldInput,
  type CandidateFormValues,
} from "./AddCandidates";

type EditCandidateModalProps = {
  pageantId: string;
  candidate: CandidateResponse | null;
  onClose: () => void;
};

export default function EditCandidateModal({
  pageantId,
  candidate,
  onClose,
}: EditCandidateModalProps) {
  const updateContestant = useUpdateContestant(pageantId, candidate?.id ?? "");
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
  });

  useEffect(() => {
    if (candidate) {
      reset({
        contestantNumber: candidate.contestantNumber,
        firstName: candidate.firstName,
        middleName: candidate.middleName ?? "",
        lastName: candidate.lastName,
        displayName: candidate.displayName ?? "",
        gender:
          candidate.gender === "Male" || candidate.gender === "Female"
            ? candidate.gender
            : undefined,
        photoUrl: candidate.photoUrl ?? "",
        biography: candidate.biography ?? "",
      });
    }
  }, [candidate, reset]);

  function handleClose() {
    if (updateContestant.isPending || isUploadingPhoto) return;
    onClose();
  }

  async function onSubmit(data: CandidateFormValues) {
    const gender = data.gender?.trim() || null;

    try {
      await updateContestant.mutateAsync({
        contestantNumber: data.contestantNumber,
        firstName: data.firstName.trim(),
        middleName: data.middleName?.trim() || null,
        lastName: data.lastName.trim(),
        displayName: data.displayName?.trim() || null,
        gender,
        photoUrl: data.photoUrl?.trim() || null,
        biography: data.biography?.trim() || null,
      });

      toast.success(`${data.firstName.trim()} ${data.lastName.trim()} updated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to update candidate.");
    }
  }

  return (
    <Modal
      open={!!candidate}
      onClose={handleClose}
      title="Edit Candidate"
      description={candidate ? `Editing ${candidate.displayName}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={updateContestant.isPending || isUploadingPhoto}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="edit-candidate-form"
            type="submit"
            loading={updateContestant.isPending}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-candidate-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <Field label={<>Contestant Number <span className="text-error">*</span></>} error={errors.contestantNumber?.message}>
          <input
            type="number"
            min={1}
            placeholder="e.g. 1"
            disabled={updateContestant.isPending}
            {...register("contestantNumber", { valueAsNumber: true })}
            className={fieldInput}
          />
        </Field>

        <div className="space-y-4">
          <Field label={<>First Name <span className="text-error">*</span></>} error={errors.firstName?.message}>
            <input type="text" placeholder="First name" disabled={updateContestant.isPending}
              {...register("firstName")} className={fieldInput} />
          </Field>
          <Field label="Middle Name" error={errors.middleName?.message}>
            <input type="text" placeholder="Middle name" disabled={updateContestant.isPending}
              {...register("middleName")} className={fieldInput} />
          </Field>
          <Field label={<>Last Name <span className="text-error">*</span></>} error={errors.lastName?.message}>
            <input type="text" placeholder="Last name" disabled={updateContestant.isPending}
              {...register("lastName")} className={fieldInput} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Display Name"
            error={errors.displayName?.message}
            hint="Leave blank to use the candidate's name."
          >
            <input type="text" placeholder="e.g. Maria Santos" disabled={updateContestant.isPending}
              {...register("displayName")} className={fieldInput} />
          </Field>

          <Field label={<>Gender <span className="text-error">*</span></>} error={errors.gender?.message} hint="Category eligibility is set separately when you create a category.">
            <select disabled={updateContestant.isPending} {...register("gender")} className={fieldInput}>
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
            disabled={updateContestant.isPending}
            {...register("biography")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

      </form>
    </Modal>
  );
}
