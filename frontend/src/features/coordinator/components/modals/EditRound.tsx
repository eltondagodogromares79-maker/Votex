"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateRound } from "@/src/features/coordinator/hooks/useRounds";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { RoundResponse, RoundStatus } from "@/src/types";
import {
  editRoundFormSchema,
  Field,
  fieldInput,
  type EditRoundFormValues,
} from "./AddRound";

type EditRoundModalProps = {
  pageantId: string;
  round: RoundResponse | null;
  onClose: () => void;
};

const STATUS_OPTIONS: { value: RoundStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "FINALIZED", label: "Completed" },
];

export default function EditRoundModal({
  pageantId,
  round,
  onClose,
}: EditRoundModalProps) {
  const updateRound = useUpdateRound(pageantId, round?.id ?? "");
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditRoundFormValues>({
    resolver: zodResolver(editRoundFormSchema),
  });

  useEffect(() => {
    if (round) {
      reset({
        name: round.name,
        roundNumber: round.roundNumber,
        roundType: round.roundType,
        advancementCount: round.advancementCount ?? undefined,
        status: round.status,
      });
    }
  }, [round, reset]);

  function handleClose() {
    if (updateRound.isPending) return;
    onClose();
  }

  async function onSubmit(data: EditRoundFormValues) {
    setSubmitError(null);
    try {
      await updateRound.mutateAsync({
        name: data.name.trim(),
        roundNumber: data.roundNumber,
        roundType: data.roundType,
        advancementCount: data.advancementCount ?? null,
        startsAt: round?.startsAt ?? null,
        endsAt: round?.endsAt ?? null,
        status: data.status,
      });

      toast.success(`"${data.name.trim()}" updated.`);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.userMessage : err instanceof Error ? err.message : "Failed to update round.");
    }
  }

  return (
    <Modal
      open={!!round}
      onClose={handleClose}
      title="Edit Round"
      description={round ? `Editing ${round.name}` : ""}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={updateRound.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="edit-round-form"
            type="submit"
            loading={updateRound.isPending}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-round-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
              <input
                type="text"
                placeholder="e.g. Preliminary Round"
                disabled={updateRound.isPending}
                {...register("name")}
                className={fieldInput}
              />
            </Field>
          </div>

          <Field label={<>Round Number <span className="text-error">*</span></>} error={errors.roundNumber?.message}>
            <input
              type="number"
              min={1}
              placeholder="e.g. 1"
              disabled={updateRound.isPending}
              {...register("roundNumber", { valueAsNumber: true })}
              className={fieldInput}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label={<>Round Type <span className="text-error">*</span></>}
            error={errors.roundType?.message}
            hint="This can be any pageant-specific label, up to 100 characters."
          >
            <input
              type="text"
              maxLength={100}
              disabled={updateRound.isPending}
              {...register("roundType")}
              className={fieldInput}
            />
          </Field>

          <Field label={<>Status <span className="text-error">*</span></>} error={errors.status?.message} hint="Opening requires category weights to total 100% per eligibility group and each category’s criteria to total 100 points.">
            <select
              disabled={updateRound.isPending}
              {...register("status")}
              className={fieldInput}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Advancement Count"
            error={errors.advancementCount?.message}
            hint="Optional. Number of candidates advancing from this round."
          >
            <input
              type="number"
              min={0}
              placeholder="e.g. 10"
              disabled={updateRound.isPending}
              {...register("advancementCount", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
              className={fieldInput}
            />
          </Field>
        </div>

        {submitError ? <div role="alert" className="border border-red-300 bg-red-950/50 px-4 py-3 text-small text-red-100"><p className="font-semibold">Could not update round</p><p className="mt-1 break-words">{submitError}</p></div> : null}

      </form>
    </Modal>
  );
}
