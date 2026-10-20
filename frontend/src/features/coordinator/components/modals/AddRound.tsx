"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  roundType: z.string().trim().min(1, "Round type is required").max(100, "Round type must be 100 characters or fewer"),
  advancementCount: z.number().int().min(1, "Must be at least 1").nullable().optional(),
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

const addRoundFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a round name.").max(150),
  roundNumber: z.number().int().min(1, "Order must be at least 1."),
  advancementType: z.enum(["UNLIMITED", "LIMITED"]),
  advancementCount: z.number().int().min(1, "Enter at least one advancing candidate.").optional(),
  status: z.enum(["DRAFT", "OPEN"]),
}).superRefine((data, context) => {
  if (data.advancementType === "LIMITED" && data.advancementCount === undefined) {
    context.addIssue({ code: "custom", path: ["advancementCount"], message: "Enter how many candidates advance." });
  }
});

type AddRoundFormValues = z.infer<typeof addRoundFormSchema>;

type AddRoundModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
  canAdd?: boolean;
  limitMessage?: string;
};

const DEFAULT_VALUES: Partial<AddRoundFormValues> = {
  name: "",
  roundNumber: undefined,
  advancementType: "UNLIMITED",
  advancementCount: undefined,
  status: "DRAFT",
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
  canAdd = true,
  limitMessage,
}: AddRoundModalProps) {
  const createRound = useCreateRound(pageantId);
  const { toast } = useToast();
  const [requestError, setRequestError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddRoundFormValues>({
    resolver: zodResolver(addRoundFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setRequestError(null);
    }
  }, [open, reset]);

  function handleClose() {
    if (createRound.isPending) return;
    onClose();
  }

  async function onSubmit(data: AddRoundFormValues) {
    setRequestError(null);
    if (!canAdd) {
      setRequestError(limitMessage ?? "The subscription limit for rounds has been reached.");
      return;
    }
    try {
      await createRound.mutateAsync({
        name: data.name.trim(),
        roundNumber: data.roundNumber,
        roundType: data.name.trim(),
        status: data.status,
        advancementCount: data.advancementType === "LIMITED" ? data.advancementCount ?? null : null,
        startsAt: null,
        endsAt: null,
      });

      toast.success(`"${data.name.trim()}" added as a round.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      setRequestError(err instanceof ApiError ? err.userMessage : "Failed to add round. Please try again.");
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
            disabled={!canAdd || createRound.isPending}
          >
            Add Round
          </Button>
        </>
      }
    >
      <form id="add-round-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {!canAdd && limitMessage ? <div role="status" className="border border-amber-300 bg-amber-50 px-4 py-3 text-small text-amber-900">{limitMessage}</div> : null}
        {requestError ? <div role="alert" className="border border-red-300 bg-red-950/40 px-4 py-3 text-small text-red-100"><p className="font-semibold">Could not add round</p><p className="mt-1 leading-relaxed">{requestError}</p></div> : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
            <input type="text" placeholder="e.g. Preliminary" disabled={createRound.isPending} autoFocus {...register("name")} className={fieldInput} />
          </Field>
          <Field label={<>Order <span className="text-error">*</span></>} error={errors.roundNumber?.message} hint="The order this round appears in.">
            <input type="number" min={1} placeholder="e.g. 1" disabled={createRound.isPending} {...register("roundNumber", { valueAsNumber: true })} className={fieldInput} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={<>Advancement type <span className="text-error">*</span></>} error={errors.advancementType?.message}>
            <select disabled={createRound.isPending} {...register("advancementType")} className={fieldInput}>
              <option value="UNLIMITED">No fixed number</option>
              <option value="LIMITED">Set number advancing</option>
            </select>
          </Field>
          <Field label={<>Status <span className="text-error">*</span></>} error={errors.status?.message} hint="A round can be opened after its categories and criteria are configured.">
            <select disabled={createRound.isPending} {...register("status")} className={fieldInput}>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
            </select>
          </Field>
        </div>

        {watch("advancementType") === "LIMITED" ? (
          <Field label={<>Candidates advancing <span className="text-error">*</span></>} error={errors.advancementCount?.message}>
            <input type="number" min={1} placeholder="e.g. 10" disabled={createRound.isPending} {...register("advancementCount", { setValueAs: (value) => value === "" ? undefined : Number(value) })} className={fieldInput} />
          </Field>
        ) : null}
      </form>
    </Modal>
  );
}
