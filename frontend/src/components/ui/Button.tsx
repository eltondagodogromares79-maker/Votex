import { cn } from "@/src/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-caption text-white hover:bg-navy/90 disabled:bg-navy/40",
  secondary:
    "bg-gold text-caption text-navy font-semibold hover:bg-gold-hover disabled:bg-gold/40",
  ghost:
    "bg-surface text-caption text-black  hover:bg-slate text-navy border border-border disabled:opacity-40",
  danger:
    "bg-error text-caption  text-white hover:bg-error/90 disabled:bg-error/40",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-small",
  md: "h-10 px-4 text-body",
  lg: "h-12 px-6 text-body font-medium",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium",
        "transition-colors duration-150 cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
