/**
 * OrgBadge — inline status/role pill.
 */

import { cn } from "@/src/lib/utils";

type BadgeVariant = "gold" | "success" | "error" | "navy" | "muted" | "warning";

interface OrgBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  gold:    "bg-gold/15    text-charcoal",
  success: "bg-success/15 text-success",
  error:   "bg-error/15   text-error",
  navy:    "bg-navy/10    text-navy",
  warning: "bg-warning/15 text-charcoal",
  muted:   "bg-border     text-muted",
};

export default function OrgBadge({ children, variant = "muted", className }: OrgBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-caption font-semibold uppercase tracking-[0.1em]",
      VARIANT_CLASSES[variant],
      className,
    )}>
      {children}
    </span>
  );
}
