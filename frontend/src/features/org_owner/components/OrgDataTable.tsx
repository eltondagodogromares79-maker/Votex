"use client";

import { cn } from "@/src/lib/utils";

export interface OrgTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  cellClass?: string;
  headerClass?: string;
  hideOnMobile?: boolean;
  primary?: boolean;
}

interface OrgDataTableProps<T> {
  columns: OrgTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export default function OrgDataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className,
}: OrgDataTableProps<T>) {
  return (
    /* Desktop table and labelled cards for narrow screens. */
    <div className={cn("border border-border bg-surface overflow-hidden", className)}>
      <div className="hidden xl:block overflow-x-auto w-full">
        <table className="w-full min-w-[520px] text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-border bg-navy/3">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted whitespace-nowrap",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.headerClass,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/60 last:border-b-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate/50",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-small text-charcoal break-words [overflow-wrap:anywhere]",
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.cellClass,
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="xl:hidden space-y-3 p-3">
        {data.map((row) => (
          <article
            key={keyExtractor(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn("min-w-0 border border-border bg-surface p-4 space-y-3", onRowClick && "cursor-pointer hover:bg-slate/30")}
          >
            {columns.map((column) => {
              const value = column.render
                ? column.render(row)
                : String((row as Record<string, unknown>)[column.key] ?? "");

              if (column.primary) {
                return <div key={column.key} className={cn("min-w-0 text-body font-medium text-charcoal break-words [overflow-wrap:anywhere]", column.hideOnMobile && "hidden sm:block")}>{value}</div>;
              }

              return (
                <div key={column.key} className={cn("grid min-w-0 grid-cols-[minmax(72px,auto)_minmax(0,1fr)] items-start gap-2", column.hideOnMobile && "hidden sm:grid")}>
                  <span className="text-caption text-muted">{column.header}</span>
                  <span className="min-w-0 text-right text-small text-charcoal break-words [overflow-wrap:anywhere]">{value}</span>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </div>
  );
}
