"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateCategory } from "@/src/features/coordinator/hooks/useCategories";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useRounds } from "@/src/features/coordinator/hooks/useRounds";
import { usePageantResourceLimits } from "@/src/features/coordinator/hooks/usePageants";

export const categoryFormSchema = z.object({
  code: z.string().min(1, "Required").max(50),
  name: z.string().min(1, "Required").max(150),
  description: z.string().max(1000).optional(),
  displayOrder: z.number().int().min(0).optional(),
  eligibilityScope: z.enum(["OPEN", "WOMEN", "MEN", "LGBTQ_PLUS", "CUSTOM"]),
  eligibilityNotes: z.string().max(500).optional(),
  roundId: z.string().optional(),
}).superRefine((data, context) => {
  if (data.eligibilityScope === "CUSTOM" && !data.eligibilityNotes?.trim()) {
    context.addIssue({ code: "custom", path: ["eligibilityNotes"], message: "Add details for custom eligibility." });
  }
});

const addCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(150),
  description: z.string().max(1000).optional(),
  displayOrder: z.number().int().min(0, "Display order cannot be negative."),
  eligibilityScope: z.enum(["OPEN", "WOMEN", "MEN"]),
  roundId: z.string().min(1, "Choose a round for this category."),
});

type AddCategoryFormValues = z.infer<typeof addCategoryFormSchema>;

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type AddCategoryModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
};

const DEFAULT_VALUES: Partial<AddCategoryFormValues> = {
  name: "",
  description: "",
  displayOrder: 0,
  eligibilityScope: "OPEN",
  roundId: "",
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

export default function AddCategoryModal({
  pageantId,
  open,
  onClose,
}: AddCategoryModalProps) {
  const createCategory = useCreateCategory(pageantId);
  const { data: rounds = [] } = useRounds(pageantId);
  const { data: limits, isLoading: limitsLoading } = usePageantResourceLimits(pageantId);
  const { toast } = useToast();
  const [requestError, setRequestError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCategoryFormValues>({
    resolver: zodResolver(addCategoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setRequestError(null);
    }
  }, [open, reset]);

  function handleClose() {
    if (createCategory.isPending) return;
    onClose();
  }

  async function onSubmit(data: AddCategoryFormValues) {
    setRequestError(null);
    if (limitsLoading || !limits?.hasActiveSubscription) {
      setRequestError("An active subscription is required before you can add categories.");
      return;
    }
    const selectedRound = rounds.find((round) => round.id === data.roundId);
    const selectedUsed = limits.roundCategories?.find((item) => item.roundId === data.roundId)?.categoriesUsed ?? 0;
    if (!selectedRound || (limits.maxCategoriesPerRound !== null && selectedUsed >= limits.maxCategoriesPerRound)) {
      setRequestError("The selected round has reached its category limit. Choose another round with an available slot.");
      return;
    }
    try {
      const code = data.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "CATEGORY";
      await createCategory.mutateAsync({
        code,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        displayOrder: data.displayOrder ?? 0,
        eligibilityScope: data.eligibilityScope,
        eligibilityNotes: null,
        roundId: data.roundId,
      });

      toast.success(`${data.name.trim()} added as a category.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      setRequestError(err instanceof ApiError ? err.userMessage : "Failed to add category. Please try again.");
    }
  }

  const roundsWithCapacity = rounds.filter((round) => {
    if (!limits?.hasActiveSubscription) return false;
    if (limits.maxCategoriesPerRound === null) return true;
    const used = limits.roundCategories?.find((item) => item.roundId === round.id)?.categoriesUsed ?? 0;
    return used < limits.maxCategoriesPerRound;
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Category"
      description="Add a judging category and choose the round it belongs to."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={createCategory.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="add-category-form"
            type="submit"
            loading={createCategory.isPending}
            disabled={createCategory.isPending || limitsLoading || !limits?.hasActiveSubscription || rounds.length === 0 || roundsWithCapacity.length === 0}
          >
            Add Category
          </Button>
        </>
      }
    >
      <form id="add-category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {requestError ? <div role="alert" className="border border-red-300 bg-red-950/40 px-4 py-3 text-small text-red-100"><p className="font-semibold">Could not add category</p><p className="mt-1 leading-relaxed">{requestError}</p></div> : null}

        <Field label={<>Round <span className="text-error">*</span></>} error={errors.roundId?.message} hint="Choose which round will use this category.">
          <select {...register("roundId")} disabled={createCategory.isPending || limitsLoading || !limits?.hasActiveSubscription || rounds.length === 0} className={fieldInput}>
            <option value="">Select a round</option>
            {rounds.map((round) => {
              const cap = limits?.maxCategoriesPerRound;
              const used = limits?.roundCategories?.find((item) => item.roundId === round.id)?.categoriesUsed ?? 0;
              const full = !limits?.hasActiveSubscription || (cap !== null && cap !== undefined && used >= cap);
              return <option key={round.id} value={round.id} disabled={full}>
                {round.roundNumber}. {round.name}{limits?.hasActiveSubscription ? ` · ${used}/${cap ?? "∞"}${full ? " · Full" : ""}` : " · Subscription required"}
              </option>;
            })}
          </select>
          {rounds.length === 0 ? <p className="mt-1 text-caption text-amber-200">Create a round before adding a category.</p> : null}
          {!limitsLoading && !limits?.hasActiveSubscription ? <p className="mt-1 text-caption text-amber-200">An active subscription is required to add categories.</p> : null}
          {rounds.length > 0 && roundsWithCapacity.length === 0 ? <p className="mt-1 text-caption text-amber-200">All rounds have reached their category limit.</p> : null}
        </Field>

        <Field label={<>Category name <span className="text-error">*</span></>} error={errors.name?.message} hint="A short code is generated automatically from this name.">
          <input type="text" placeholder="e.g. Best in Gown" disabled={createCategory.isPending} autoFocus {...register("name")} className={fieldInput} />
        </Field>

        <Field label="Description" error={errors.description?.message} hint="Optional. Maximum 1,000 characters.">
          <textarea
            rows={4}
            placeholder="Describe what this category covers..."
            disabled={createCategory.isPending}
            {...register("description")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={<>Participant eligibility <span className="text-error">*</span></>} error={errors.eligibilityScope?.message}>
          <select {...register("eligibilityScope")} disabled={createCategory.isPending} className={fieldInput}>
            <option value="OPEN">Open to all</option>
            <option value="WOMEN">Female</option>
            <option value="MEN">Male</option>
          </select>
        </Field>
        </div>

        <Field label={<>Display order <span className="text-error">*</span></>} error={errors.displayOrder?.message} hint="Controls the order categories appear in.">
          <input
            type="number"
            min={0}
            placeholder="0"
            disabled={createCategory.isPending || rounds.length === 0 || roundsWithCapacity.length === 0}
            {...register("displayOrder", { valueAsNumber: true })}
            className={fieldInput}
          />
        </Field>

      </form>
    </Modal>
  );
}
