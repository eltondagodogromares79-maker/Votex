/**
 * OrgStatCard — metric card used on the dashboard.
 *
 * Shows: label, large value, optional sub-text, optional icon,
 *        optional trend (up/down/neutral).
 */

import { cn } from "@/src/lib/utils";

type Trend = "up" | "down" | "neutral";

interface OrgStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: Trend;
  trendLabel?: string;
  /** Gold accent header band */
  accent?: boolean;
  className?: string;
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
  if (trend === "down") return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" />
    </svg>
  );
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

const TREND_COLOR: Record<Trend, string> = {
  up:      "text-success",
  down:    "text-error",
  neutral: "text-muted",
};

export default function OrgStatCard({
  label,
  value,
  sub,
  icon,
  trend,
  trendLabel,
  accent = false,
  className,
}: OrgStatCardProps) {
  return (
    <div className={cn(
      "bg-surface border border-border flex flex-col overflow-hidden",
      className,
    )}>
      {/* Accent bar */}
      {accent && <div className="h-1 bg-gold w-full shrink-0" />}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Top row: label + icon */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          {icon && (
            <div className="w-9 h-9 bg-navy/6 flex items-center justify-center text-navy shrink-0">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <p className="font-serif font-bold text-charcoal text-[2rem] leading-none">
          {value}
        </p>

        {/* Bottom row: sub + trend */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          {sub && <p className="text-caption text-muted">{sub}</p>}
          {trend && trendLabel && (
            <div className={cn("flex items-center gap-1 text-caption font-semibold", TREND_COLOR[trend])}>
              <TrendIcon trend={trend} />
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
