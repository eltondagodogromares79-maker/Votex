"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateCategory } from "@/src/features/coordinator/hooks/useCategories";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

export const categoryFormSchema = z.object({
  code: z.string().min(1, "Required").max(50),
  name: z.string().min(1, "Required").max(150),
  description: z.string().max(1000).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type AddCategoryModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
};

const DEFAULT_VALUES: Partial<CategoryFormValues> = {
  code: "",
  name: "",
  description: "",
  displayOrder: 0,
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
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  function handleClose() {
    if (createCategory.isPending) return;
    onClose();
  }

  async function onSubmit(data: CategoryFormValues) {
    try {
      await createCategory.mutateAsync({
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        displayOrder: data.displayOrder ?? 0,
      });

      toast.success(`${data.name.trim()} added as a category.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to add category.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Category"
      description="Add a new judging category to this pageant."
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
          >
            Add Category
          </Button>
        </>
      }
    >
      <form id="add-category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Code <span className="text-error">*</span></>} error={errors.code?.message}>
            <input type="text" placeholder="e.g. SWIMWEAR" disabled={createCategory.isPending}
              autoFocus
              {...register("code")} className={fieldInput} />
          </Field>
          <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
            <input type="text" placeholder="e.g. Swimwear" disabled={createCategory.isPending}
              {...register("name")} className={fieldInput} />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message} hint="Optional. Maximum 1,000 characters.">
          <textarea
            rows={4}
            placeholder="Describe what this category covers..."
            disabled={createCategory.isPending}
            {...register("description")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

        <Field label="Display Order" error={errors.displayOrder?.message} hint="Optional. Determines the order categories appear in.">
          <input
            type="number"
            min={0}
            placeholder="0"
            disabled={createCategory.isPending}
            {...register("displayOrder", { valueAsNumber: true })}
            className={fieldInput}
          />
        </Field>

      </form>
    </Modal>
  );
}
