import React from "react";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  cellClass?: string;
  hideOnMobile?: boolean;
}

interface AdminDataTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
}

export default function AdminDataTable<T>({ columns, data, keyExtractor }: AdminDataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small border-collapse">
        <thead>
          <tr className="border-b border-border bg-slate/50">
            {columns.map((col) => (
              <th key={col.key}
                className={`px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.08em] text-muted ${col.cellClass ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
              {columns.map((col) => (
                <td key={col.key}
                  className={`px-4 py-3.5 align-middle ${col.cellClass ?? ""} ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
