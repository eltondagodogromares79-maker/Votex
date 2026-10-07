"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateCriterion } from "@/src/features/coordinator/hooks/useCategories";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

const SCORE_REGEX = /^\d+(\.\d{1,2})?$/;

export const criterionFormSchema = z
  .object({
    code: z.string().min(1, "Required").max(50),
    name: z.string().min(1, "Required").max(150),
    description: z.string().max(1000).optional(),
    defaultMaximumScore: z
      .string()
      .min(1, "Required")
      .regex(SCORE_REGEX, "Enter a valid number (up to 2 decimal places)"),
    defaultMinimumScore: z
      .string()
      .min(1, "Required")
      .regex(SCORE_REGEX, "Enter a valid number (up to 2 decimal places)"),
  })
  .refine(
    (data) => Number(data.defaultMinimumScore) <= Number(data.defaultMaximumScore),
    {
      message: "Minimum score must be less than or equal to the maximum score.",
      path: ["defaultMinimumScore"],
    },
  );

export type CriterionFormValues = z.infer<typeof criterionFormSchema>;

type AddCriterionModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
};

const DEFAULT_VALUES: Partial<CriterionFormValues> = {
  code: "",
  name: "",
  description: "",
  defaultMaximumScore: "",
  defaultMinimumScore: "",
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

export default function AddCriterionModal({
  pageantId,
  open,
  onClose,
}: AddCriterionModalProps) {
  const createCriterion = useCreateCriterion(pageantId);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  function handleClose() {
    if (createCriterion.isPending) return;
    onClose();
  }

  async function onSubmit(data: CriterionFormValues) {
    try {
      await createCriterion.mutateAsync({
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        defaultMaximumScore: data.defaultMaximumScore,
        defaultMinimumScore: data.defaultMinimumScore,
      });

      toast.success(`${data.name.trim()} added as a criterion.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to add criterion.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Criterion"
      description="Add a new judging criterion to this pageant."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={createCriterion.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="add-criterion-form"
            type="submit"
            loading={createCriterion.isPending}
          >
            Add Criterion
          </Button>
        </>
      }
    >
      <form id="add-criterion-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Code <span className="text-error">*</span></>} error={errors.code?.message}>
            <input type="text" placeholder="e.g. POISE" disabled={createCriterion.isPending}
              autoFocus
              {...register("code")} className={fieldInput} />
          </Field>
          <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
            <input type="text" placeholder="e.g. Poise & Confidence" disabled={createCriterion.isPending}
              {...register("name")} className={fieldInput} />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message} hint="Optional. Maximum 1,000 characters.">
          <textarea
            rows={4}
            placeholder="Describe what this criterion covers..."
            disabled={createCriterion.isPending}
            {...register("description")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Default Minimum Score <span className="text-error">*</span></>} error={errors.defaultMinimumScore?.message}>
            <input type="number" step="0.01" min="0" placeholder="e.g. 0" disabled={createCriterion.isPending}
              {...register("defaultMinimumScore")} className={fieldInput} />
          </Field>
          <Field label={<>Default Maximum Score <span className="text-error">*</span></>} error={errors.defaultMaximumScore?.message}>
            <input type="number" step="0.01" min="0" placeholder="e.g. 100" disabled={createCriterion.isPending}
              {...register("defaultMaximumScore")} className={fieldInput} />
          </Field>
        </div>

      </form>
    </Modal>
  );
}
