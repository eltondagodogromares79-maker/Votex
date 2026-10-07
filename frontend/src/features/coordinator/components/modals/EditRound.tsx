"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
  ROUND_TYPE_OPTIONS,
  toDatetimeLocalInput,
  fromDatetimeLocalInput,
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
  { value: "FINALIZED", label: "Finalized" },
];

export default function EditRoundModal({
  pageantId,
  round,
  onClose,
}: EditRoundModalProps) {
  const updateRound = useUpdateRound(pageantId, round?.id ?? "");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
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
        startsAt: toDatetimeLocalInput(round.startsAt),
        endsAt: toDatetimeLocalInput(round.endsAt),
        status: round.status,
      });
    }
  }, [round, reset]);

  function handleClose() {
    if (updateRound.isPending) return;
    onClose();
  }

  async function onSubmit(data: EditRoundFormValues) {
    try {
      await updateRound.mutateAsync({
        name: data.name.trim(),
        roundNumber: data.roundNumber,
        roundType: data.roundType,
        advancementCount: data.advancementCount ?? null,
        startsAt: fromDatetimeLocalInput(data.startsAt ?? ""),
        endsAt: fromDatetimeLocalInput(data.endsAt ?? ""),
        status: data.status,
      });

      toast.success(`"${data.name.trim()}" updated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to update round.");
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
          <Field label={<>Round Type <span className="text-error">*</span></>} error={errors.roundType?.message}>
            <select
              disabled={updateRound.isPending}
              {...register("roundType")}
              className={fieldInput}
            >
              {ROUND_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={<>Status <span className="text-error">*</span></>} error={errors.status?.message}>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Starts At" error={errors.startsAt?.message} hint="Optional.">
            <Controller
              control={control}
              name="startsAt"
              render={({ field }) => (
                <input
                  type="datetime-local"
                  disabled={updateRound.isPending}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={fieldInput}
                />
              )}
            />
          </Field>

          <Field label="Ends At" error={errors.endsAt?.message} hint="Optional.">
            <Controller
              control={control}
              name="endsAt"
              render={({ field }) => (
                <input
                  type="datetime-local"
                  disabled={updateRound.isPending}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={fieldInput}
                />
              )}
            />
          </Field>
        </div>

      </form>
    </Modal>
  );
}
