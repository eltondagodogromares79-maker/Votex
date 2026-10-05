import React from "react";

type BadgeVariant = "success" | "muted" | "gold" | "navy" | "error" | "warning";

const STYLES: Record<BadgeVariant, string> = {
  success: "bg-success/12 text-success border-success/20",
  muted:   "bg-border/50 text-muted border-border",
  gold:    "bg-gold/12 text-gold border-gold/20",
  navy:    "bg-navy/10 text-navy border-navy/20",
  error:   "bg-error/10 text-error border-error/20",
  warning: "bg-gold/12 text-charcoal border-gold/30",
};

interface AdminBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export default function AdminBadge({ variant = "muted", children }: AdminBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] border ${STYLES[variant]}`}>
      {children}
    </span>
  );
}
