import { cn } from "@/src/lib/utils";
import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";

// ── Base field wrapper ───────────────────────────────────────────────────────
interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id: string;
  children: React.ReactNode;
}

export function Field({ label, error, hint, required, id, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-small font-medium text-charcoal"
        >
          {label}
          {required && (
            <span className="ml-1 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-caption text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ── Shared input style ───────────────────────────────────────────────────────
const inputBase =
  "w-full rounded-md bg-surface border border-border text-charcoal text-body " +
  "px-3 py-2 placeholder:text-muted/60 " +
  "focus:outline-none focus:border-navy " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "transition-colors duration-150";

const errorBorder = "border-error focus:border-error";

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      id,
      containerClassName,
      className,
      required,
      "aria-describedby": ariaDby,
      ...props
    },
    ref,
  ) => {
    const fieldId = id ?? props.name ?? "";
    const describedBy =
      [ariaDby, error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : ""]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <Field
        label={label}
        error={error}
        hint={hint}
        required={required}
        id={fieldId}
      >
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(inputBase, error && errorBorder, className)}
          {...props}
        />
      </Field>
    );
  },
);
Input.displayName = "Input";

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, required, className, ...props }, ref) => {
    const fieldId = id ?? props.name ?? "";
    return (
      <Field label={label} error={error} hint={hint} required={required} id={fieldId}>
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          rows={4}
          className={cn(inputBase, "resize-y min-h-[96px]", error && errorBorder, className)}
          {...props}
        />
      </Field>
    );
  },
);
Textarea.displayName = "Textarea";

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, id, required, options, placeholder, className, ...props },
    ref,
  ) => {
    const fieldId = id ?? props.name ?? "";
    return (
      <Field label={label} error={error} hint={hint} required={required} id={fieldId}>
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(inputBase, "cursor-pointer", error && errorBorder, className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
    );
  },
);
Select.displayName = "Select";
