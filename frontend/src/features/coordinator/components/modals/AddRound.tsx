"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateRound } from "@/src/features/coordinator/hooks/useRounds";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

/**
 * Form schema for creating/editing a round.
 */
export const roundFormSchema = z.object({
  name: z.string().min(1, "Required").max(150),
  roundNumber: z.number().int().min(1, "Must be at least 1"),
  roundType: z.enum([
    "PRELIMINARY",
    "SWIMWEAR",
    "FORMAL_WEAR",
    "TALENT",
    "QUESTION_AND_ANSWER",
    "FINAL",
    "CUSTOM",
  ]),
  advancementCount: z.number().int().min(0).nullable().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export type RoundFormValues = z.infer<typeof roundFormSchema>;

/**
 * Edit form schema — extends the base round schema with the required
 * status field (mirrors UpdateRoundRequest extending CreateRoundRequest).
 */
export const editRoundFormSchema = roundFormSchema.extend({
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "FINALIZED"]),
});

export type EditRoundFormValues = z.infer<typeof editRoundFormSchema>;

export const ROUND_TYPE_OPTIONS: { value: RoundFormValues["roundType"]; label: string }[] = [
  { value: "PRELIMINARY", label: "Preliminary" },
  { value: "SWIMWEAR", label: "Swimwear" },
  { value: "FORMAL_WEAR", label: "Formal Wear" },
  { value: "TALENT", label: "Talent" },
  { value: "QUESTION_AND_ANSWER", label: "Question & Answer" },
  { value: "FINAL", label: "Final" },
  { value: "CUSTOM", label: "Custom" },
];

type AddRoundModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
};

const DEFAULT_VALUES: Partial<RoundFormValues> = {
  name: "",
  roundNumber: undefined,
  roundType: "PRELIMINARY",
  advancementCount: undefined,
  startsAt: "",
  endsAt: "",
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

/**
 * Converts an RFC3339 string to the local-time `YYYY-MM-DDTHH:mm` format
 * required by <input type="datetime-local">'s value prop.
 *
 * Deliberately avoids toISOString() (UTC) which would shift the displayed time.
 */
export function toDatetimeLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a <input type="datetime-local"> local-time string back to an
 * RFC3339 string. Empty input returns null.
 */
export function fromDatetimeLocalInput(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function AddRoundModal({
  pageantId,
  open,
  onClose,
}: AddRoundModalProps) {
  const createRound = useCreateRound(pageantId);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RoundFormValues>({
    resolver: zodResolver(roundFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  function handleClose() {
    if (createRound.isPending) return;
    onClose();
  }

  async function onSubmit(data: RoundFormValues) {
    try {
      await createRound.mutateAsync({
        name: data.name.trim(),
        roundNumber: data.roundNumber,
        roundType: data.roundType,
        advancementCount: data.advancementCount ?? null,
        startsAt: fromDatetimeLocalInput(data.startsAt ?? ""),
        endsAt: fromDatetimeLocalInput(data.endsAt ?? ""),
      });

      toast.success(`"${data.name.trim()}" added as a round.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to add round.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Round"
      description="Add a new round to this pageant."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={createRound.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="add-round-form"
            type="submit"
            loading={createRound.isPending}
          >
            Add Round
          </Button>
        </>
      }
    >
      <form id="add-round-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
              <input
                type="text"
                placeholder="e.g. Preliminary Round"
                disabled={createRound.isPending}
                autoFocus
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
              disabled={createRound.isPending}
              {...register("roundNumber", { valueAsNumber: true })}
              className={fieldInput}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>Round Type <span className="text-error">*</span></>} error={errors.roundType?.message}>
            <select
              disabled={createRound.isPending}
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

          <Field
            label="Advancement Count"
            error={errors.advancementCount?.message}
            hint="Optional. Number of candidates advancing from this round."
          >
            <input
              type="number"
              min={0}
              placeholder="e.g. 10"
              disabled={createRound.isPending}
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
                  disabled={createRound.isPending}
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
                  disabled={createRound.isPending}
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
