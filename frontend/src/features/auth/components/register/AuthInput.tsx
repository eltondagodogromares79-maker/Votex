import React from "react";
import { cn } from "@/src/lib/utils";

interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function AuthInput({
  label,
  error,
  hint,
  id,
  required,
  className,
  ...props
}: AuthInputProps) {
  const fieldId = id ?? props.name ?? "";

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="block text-small font-medium text-white/80 mb-1"
      >
        {label}

        {required && (
          <span className="ml-1 text-gold/60" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${fieldId}-error`
            : hint
              ? `${fieldId}-hint`
              : undefined
        }
        className={cn(
          "w-full bg-white/8 border border-white/15 text-white text-small px-3 py-2.5",
          "placeholder:text-white/30 focus:outline-none focus:border-gold/60",
          "transition-colors duration-150",
          error && "border-error",
          className
        )}
        {...props}
      />

      {error ? (
        <p
          id={`${fieldId}-error`}
          className="text-caption text-error mt-1"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${fieldId}-hint`}
          className="text-caption text-white/40 mt-1"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}