import { cn } from "@/src/lib/utils";

export type BadgeVariant = "default" | "success" | "error" | "warning" | "navy" | "gold";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  /** Override with arbitrary Tailwind classes: bg-X text-Y */
  colorClasses?: { bg: string; text: string };
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-border text-muted",
  success: "bg-success/15 text-success",
  error: "bg-error/15 text-error",
  warning: "bg-gold/20 text-charcoal",
  navy: "bg-navy/10 text-navy",
  gold: "bg-gold text-navy",
};

export function Badge({
  children,
  variant = "default",
  colorClasses,
  className,
}: BadgeProps) {
  const colorStyle = colorClasses
    ? `${colorClasses.bg} ${colorClasses.text}`
    : VARIANT_CLASSES[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-caption font-medium",
        colorStyle,
        className,
      )}
    >
      {children}
    </span>
  );
}
