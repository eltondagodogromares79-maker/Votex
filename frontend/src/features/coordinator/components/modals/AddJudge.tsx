"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAssignJudge } from "@/src/features/coordinator/hooks/useStaff";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const assignJudgeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export type AssignJudgeFormValues = z.infer<typeof assignJudgeSchema>;

type AddJudgeModalProps = {
  pageantId: string;
  open: boolean;
  canAdd?: boolean;
  limitMessage?: string;
  onClose: () => void;
};

const DEFAULT_VALUES: AssignJudgeFormValues = {
  firstName: "",
  lastName: "",
  email: "",
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

export default function AddJudgeModal({
  pageantId,
  open,
  canAdd = true,
  limitMessage,
  onClose,
}: AddJudgeModalProps) {
  const assignJudge = useAssignJudge(pageantId);
  const { toast } = useToast();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmReuse, setConfirmReuse] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<AssignJudgeFormValues>({
    resolver: zodResolver(assignJudgeSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  function handleClose() {
    if (assignJudge.isPending) return;
    setSubmissionError(null);
    setConfirmReuse(false);
    onClose();
  }

  async function submitAssignment(data: AssignJudgeFormValues, confirmed = false) {
    if (!canAdd) {
      setSubmissionError(limitMessage ?? "The judge limit for this plan has been reached.");
      return;
    }
    setSubmissionError(null);
    try {
      await assignJudge.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        confirmCrossOrganizationReuse: confirmed,
      });

      toast.success(`${data.firstName.trim()} ${data.lastName.trim()} assigned as judge.`);
      reset(DEFAULT_VALUES);
      setConfirmReuse(false);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === "STAFF_ACCOUNT_CROSS_ORGANIZATION") {
        setConfirmReuse(true);
        setSubmissionError(err.userMessage);
        return;
      }
      setSubmissionError(err instanceof ApiError ? err.userMessage : "Failed to assign judge. Please try again.");
    }
  }

  async function onSubmit(data: AssignJudgeFormValues) {
    setConfirmReuse(false);
    await submitAssignment(data);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Judge"
      description="Assign a judge to this pageant."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={assignJudge.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="add-judge-form"
            type="submit"
            loading={assignJudge.isPending}
            disabled={!canAdd}
          >
            Add Judge
          </Button>
        </>
      }
    >
      <form id="add-judge-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {!canAdd && limitMessage ? <p role="alert" className="border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-caption text-amber-100">{limitMessage}</p> : null}
        {submissionError ? <div role="alert" aria-live="polite" className={`flex gap-3 border px-4 py-3 text-small leading-relaxed ${confirmReuse ? "border-amber-300/50 bg-amber-300/10 text-amber-50" : "border-error/40 bg-error/10 text-red-100"}`}><span aria-hidden="true" className="font-bold">!</span><p>{submissionError}</p></div> : null}
        {confirmReuse ? <div className="space-y-3 rounded border border-amber-300/30 bg-amber-300/5 p-4"><p className="text-caption leading-relaxed text-white/75">Continuing links the existing account and password to this organization’s pageant. No new account or password email will be created.</p><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => void submitAssignment(getValues(), true)} loading={assignJudge.isPending}>Use existing account</Button><Button variant="ghost" size="sm" onClick={() => { setConfirmReuse(false); setSubmissionError(null); }} disabled={assignJudge.isPending}>Cancel</Button></div></div> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>First Name <span className="text-error">*</span></>} error={errors.firstName?.message}>
            <input type="text" placeholder="First name" autoComplete="given-name" disabled={assignJudge.isPending}
              autoFocus
              {...register("firstName")} className={fieldInput} />
          </Field>
          <Field label={<>Last Name <span className="text-error">*</span></>} error={errors.lastName?.message}>
            <input type="text" placeholder="Last name" autoComplete="family-name" disabled={assignJudge.isPending}
              {...register("lastName")} className={fieldInput} />
          </Field>
        </div>

        <Field
          label={<>Email Address <span className="text-error">*</span></>}
          error={errors.email?.message}
          hint="Each email can have one staff role: judge or tabulator. Existing accounts are linked; new accounts receive credentials by email."
        >
          <input type="email" placeholder="judge@example.com" autoComplete="email" disabled={assignJudge.isPending}
            {...register("email")} className={fieldInput} />
        </Field>

        <div className="flex gap-3 bg-white/5 border border-white/15 px-4 py-3">
          <svg className="w-4 h-4 text-gold/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-caption text-white/50 leading-relaxed">
            If a new account is created, a temporary password will be generated and emailed. They should change it after their first sign-in.
          </p>
        </div>

      </form>
    </Modal>
  );
}
