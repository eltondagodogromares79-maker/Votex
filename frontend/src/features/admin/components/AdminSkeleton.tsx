import React from "react";

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/60 last:border-b-0">
          <div className="w-8 h-8 bg-slate animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-slate animate-pulse rounded-sm w-2/5" />
            <div className="h-3 bg-slate animate-pulse rounded-sm w-1/3 opacity-60" />
          </div>
          <div className="h-5 w-16 bg-slate animate-pulse rounded-sm shrink-0 hidden sm:block" />
          <div className="h-5 w-20 bg-slate animate-pulse rounded-sm shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function AdminStatSkeleton() {
  return (
    <div className="bg-navy overflow-hidden p-5">
      <div className="h-3 w-20 bg-white/10 animate-pulse mb-3" />
      <div className="h-8 w-16 bg-white/15 animate-pulse mb-2" />
      <div className="h-3 w-24 bg-white/10 animate-pulse" />
    </div>
  );
}