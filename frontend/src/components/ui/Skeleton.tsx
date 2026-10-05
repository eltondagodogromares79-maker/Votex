import { cn } from "@/src/lib/utils";

// ── Base skeleton pulse ──────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded bg-border/60",
        className,
      )}
    />
  );
}

// ── Table skeleton — matches a data table layout ─────────────────────────────
interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading data…" role="status">
      {/* Header row */}
      <div className="flex gap-4 mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 mb-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1", c === 0 && "max-w-[80px]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div
      className="bg-surface rounded-md p-6 space-y-3"
      aria-busy="true"
      role="status"
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// ── Card grid skeleton ────────────────────────────────────────────────────────
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-busy="true"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Score grid skeleton (judge / tabulator scoring interface) ─────────────────
export function ScoreGridSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" role="status">
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-12" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
