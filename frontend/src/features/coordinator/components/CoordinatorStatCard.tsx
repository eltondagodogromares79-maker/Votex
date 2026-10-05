import { cn } from "@/src/lib/utils";

type Trend = "up" | "down" | "neutral";

interface CoordinatorStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: Trend;
  trendLabel?: string;
  accent?: boolean;
  dark?: boolean;
  className?: string;
}

const TREND_COLOR: Record<Trend, string> = {
  up:      "text-success",
  down:    "text-error",
  neutral: "text-muted",
};

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
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
}

export default function CoordinatorStatCard({
  label, value, sub, icon, trend, trendLabel, accent = false, dark = false, className,
}: CoordinatorStatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden flex flex-col",
      dark ? "bg-navy" : "bg-surface border border-border",
      className,
    )}>
      {accent && !dark && <div className="h-1 bg-gold w-full shrink-0" />}
      {dark && (
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gold/5 rotate-12 pointer-events-none" aria-hidden="true" />
      )}
      <div className="p-5 flex flex-col gap-3 flex-1 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-caption font-semibold uppercase tracking-[0.12em]", dark ? "text-gold/70" : "text-muted")}>
            {label}
          </p>
          {icon && (
            <div className={cn("w-9 h-9 flex items-center justify-center shrink-0",
              dark ? "bg-gold/12 text-gold border border-gold/20" : "bg-navy/6 text-navy")}>
              {icon}
            </div>
          )}
        </div>
        <p className={cn("font-serif font-bold text-[2rem] leading-none", dark ? "text-gold" : "text-charcoal")}>
          {value}
        </p>
        <div className="flex items-center justify-between gap-2 mt-auto">
          {sub && <p className={cn("text-caption", dark ? "text-white/40" : "text-muted")}>{sub}</p>}
          {trend && trendLabel && (
            <div className={cn("flex items-center gap-1 text-caption font-semibold", TREND_COLOR[trend])}>
              <TrendIcon trend={trend} /><span>{trendLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
