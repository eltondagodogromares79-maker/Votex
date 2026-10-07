"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAssignTabulator } from "@/src/features/coordinator/hooks/useStaff";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const assignTabulatorSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export type AssignTabulatorFormValues = z.infer<typeof assignTabulatorSchema>;

type AddTabulatorModalProps = {
  pageantId: string;
  open: boolean;
  onClose: () => void;
};

const DEFAULT_VALUES: AssignTabulatorFormValues = {
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

export default function AddTabulatorModal({
  pageantId,
  open,
  onClose,
}: AddTabulatorModalProps) {
  const assignTabulator = useAssignTabulator(pageantId);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignTabulatorFormValues>({
    resolver: zodResolver(assignTabulatorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);

  function handleClose() {
    if (assignTabulator.isPending) return;
    onClose();
  }

  async function onSubmit(data: AssignTabulatorFormValues) {
    try {
      await assignTabulator.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
      });

      toast.success(`${data.firstName.trim()} ${data.lastName.trim()} assigned as tabulator.`);
      reset(DEFAULT_VALUES);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to assign tabulator.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Tabulator"
      description="Assign a tabulator to this pageant."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={assignTabulator.isPending}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            form="add-tabulator-form"
            type="submit"
            loading={assignTabulator.isPending}
          >
            Add Tabulator
          </Button>
        </>
      }
    >
      <form id="add-tabulator-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label={<>First Name <span className="text-error">*</span></>} error={errors.firstName?.message}>
            <input type="text" placeholder="First name" autoComplete="given-name" disabled={assignTabulator.isPending}
              autoFocus
              {...register("firstName")} className={fieldInput} />
          </Field>
          <Field label={<>Last Name <span className="text-error">*</span></>} error={errors.lastName?.message}>
            <input type="text" placeholder="Last name" autoComplete="family-name" disabled={assignTabulator.isPending}
              {...register("lastName")} className={fieldInput} />
          </Field>
        </div>

        <Field
          label={<>Email Address <span className="text-error">*</span></>}
          error={errors.email?.message}
          hint="An existing account will be linked, or a new account created with credentials emailed automatically."
        >
          <input type="email" placeholder="tabulator@example.com" autoComplete="email" disabled={assignTabulator.isPending}
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
