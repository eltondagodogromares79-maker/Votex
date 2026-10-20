"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateCategory } from "@/src/features/coordinator/hooks/useCategories";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { CategoryResponse } from "@/src/types";
import {
  categoryFormSchema,
  Field,
  fieldInput,
  type CategoryFormValues,
} from "./AddCategory";

type EditCategoryModalProps = {
  pageantId: string;
  category: CategoryResponse | null;
  onClose: () => void;
};

export default function EditCategoryModal({
  pageantId,
  category,
  onClose,
}: EditCategoryModalProps) {
  const updateCategory = useUpdateCategory(pageantId, category?.id ?? "");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
  });

  useEffect(() => {
    if (category) {
      reset({
        code: category.code,
        name: category.name,
        description: category.description ?? "",
        displayOrder: category.displayOrder,
        eligibilityScope: category.eligibilityScope ?? "OPEN",
        eligibilityNotes: category.eligibilityNotes ?? "",
      });
    }
  }, [category, reset]);

  function handleClose() {
    if (updateCategory.isPending) return;
    onClose();
  }

  async function onSubmit(data: CategoryFormValues) {
    try {
      await updateCategory.mutateAsync({
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        displayOrder: data.displayOrder ?? 0,
        eligibilityScope: data.eligibilityScope,
        eligibilityNotes: data.eligibilityNotes?.trim() || null,
      });

      toast.success(`${data.name.trim()} updated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to update category.");
    }
  }

  return (
    <Modal
      open={!!category}
      onClose={handleClose}
      title="Edit Category"
      description={category ? `Editing ${category.name}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={updateCategory.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="edit-category-form"
            type="submit"
            loading={updateCategory.isPending}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Code <span className="text-error">*</span></>} error={errors.code?.message}>
            <input type="text" placeholder="e.g. SWIMWEAR" disabled={updateCategory.isPending}
              {...register("code")} className={fieldInput} />
          </Field>
          <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
            <input type="text" placeholder="e.g. Swimwear" disabled={updateCategory.isPending}
              {...register("name")} className={fieldInput} />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message} hint="Optional. Maximum 1,000 characters.">
          <textarea
            rows={4}
            placeholder="Describe what this category covers..."
            disabled={updateCategory.isPending}
            {...register("description")}
            className={`${fieldInput} h-auto py-2 resize-none`}
          />
        </Field>

        <Field label="Display Order" error={errors.displayOrder?.message} hint="Optional. Determines the order categories appear in.">
          <input
            type="number"
            min={0}
            placeholder="0"
            disabled={updateCategory.isPending}
            {...register("displayOrder", { valueAsNumber: true })}
            className={fieldInput}
          />
        </Field>

      </form>
    </Modal>
  );
}
