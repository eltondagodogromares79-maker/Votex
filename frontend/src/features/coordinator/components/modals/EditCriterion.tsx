"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateCriterion } from "@/src/features/coordinator/hooks/useCategories";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { CriterionResponse } from "@/src/types";
import {
  criterionFormSchema,
  Field,
  fieldInput,
  type CriterionFormValues,
} from "./AddCriterion";

type EditCriterionModalProps = {
  pageantId: string;
  criterion: CriterionResponse | null;
  onClose: () => void;
};

export default function EditCriterionModal({
  pageantId,
  criterion,
  onClose,
}: EditCriterionModalProps) {
  const updateCriterion = useUpdateCriterion(pageantId, criterion?.id ?? "");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionFormSchema),
  });

  useEffect(() => {
    if (criterion) {
      reset({
        code: criterion.code,
        name: criterion.name,
        description: criterion.description ?? "",
        defaultMaximumScore: criterion.defaultMaximumScore,
        defaultMinimumScore: criterion.defaultMinimumScore,
      });
    }
  }, [criterion, reset]);

  function handleClose() {
    if (updateCriterion.isPending) return;
    onClose();
  }

  async function onSubmit(data: CriterionFormValues) {
    try {
      await updateCriterion.mutateAsync({
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        defaultMaximumScore: data.defaultMaximumScore,
        defaultMinimumScore: data.defaultMinimumScore,
      });

      toast.success(`${data.name.trim()} updated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to update criterion.");
    }
  }

  return (
    <Modal
      open={!!criterion}
      onClose={handleClose}
      title="Edit Criterion"
      description={criterion ? `Editing ${criterion.name}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={updateCriterion.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="edit-criterion-form"
            type="submit"
            loading={updateCriterion.isPending}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-criterion-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Code <span className="text-error">*</span></>} error={errors.code?.message}>
            <input type="text" placeholder="e.g. POISE" disabled={updateCriterion.isPending}
              {...register("code")} className={fieldInput} />
          </Field>
          <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
            <input type="text" placeholder="e.g. Poise & Confidence" disabled={updateCriterion.isPending}
              {...register("name")} className={fieldInput} />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message} hint="Optional. Maximum 1,000 characters.">
          <textarea
            rows={4}
            placeholder="Describe what this criterion covers..."
            disabled={updateCriterion.isPending}
            {...register("description")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Default Minimum Score <span className="text-error">*</span></>} error={errors.defaultMinimumScore?.message}>
            <input type="number" step="0.01" min="0" placeholder="e.g. 0" disabled={updateCriterion.isPending}
              {...register("defaultMinimumScore")} className={fieldInput} />
          </Field>
          <Field label={<>Default Maximum Score <span className="text-error">*</span></>} error={errors.defaultMaximumScore?.message}>
            <input type="number" step="0.01" min="0" placeholder="e.g. 100" disabled={updateCriterion.isPending}
              {...register("defaultMaximumScore")} className={fieldInput} />
          </Field>
        </div>

      </form>
    </Modal>
  );
}
