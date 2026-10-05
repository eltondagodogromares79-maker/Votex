"use client";

import { cn } from "@/src/lib/utils";

export interface CoordTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  cellClass?: string;
  headerClass?: string;
  hideOnMobile?: boolean;
}

interface CoordinatorDataTableProps<T> {
  columns: CoordTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export default function CoordinatorDataTable<T>({
  columns, data, keyExtractor, onRowClick, className,
}: CoordinatorDataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto border border-border bg-surface", className)}>
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-navy/3">
            {columns.map((col) => (
              <th key={col.key}
                className={cn("px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted",
                  col.hideOnMobile && "hidden sm:table-cell", col.headerClass)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("border-b border-border/60 transition-colors",
                onRowClick && "cursor-pointer hover:bg-slate/50")}>
              {columns.map((col) => (
                <td key={col.key}
                  className={cn("px-4 py-3 text-small text-charcoal",
                    col.hideOnMobile && "hidden sm:table-cell", col.cellClass)}>
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
  );
}
