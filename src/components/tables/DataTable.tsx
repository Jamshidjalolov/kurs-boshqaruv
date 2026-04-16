import type { ReactNode } from "react";
import { Card } from "@/components/common/Card";
import { cn } from "@/lib/cn";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
  emptyDescription?: string;
  mobileCardTitle?: (row: T) => ReactNode;
}

export function DataTable<T>({
  title,
  description,
  columns,
  rows,
  emptyTitle = "Ma'lumot topilmadi",
  emptyDescription = "Hozircha ko'rsatish uchun mos yozuv yo'q.",
  mobileCardTitle
}: DataTableProps<T>) {
  const mobileColumns = mobileCardTitle ? columns.slice(1) : columns;

  return (
    <Card className="overflow-hidden p-0">
      {title ? (
        <div className="flex flex-col gap-3 border-b border-border/80 bg-white px-5 py-4 dark:bg-slate-950 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</div>
            {description ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div> : null}
          </div>
          <div className="rounded-full border border-border/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {rows.length} ta
          </div>
        </div>
      ) : null}
      {rows.length ? (
        <>
          <div className="grid gap-3 p-3 md:hidden">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="list-card">
                {mobileCardTitle ? (
                  <div className="mb-4 border-b border-border/70 pb-3 font-display text-base font-bold text-slate-900 dark:text-white">{mobileCardTitle(row)}</div>
                ) : null}
                <div className="space-y-3">
                  {mobileColumns.map((column) => (
                    <div key={column.key} className="grid gap-1">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{column.header}</div>
                      <div className="min-w-0 text-sm leading-5 text-foreground">{column.render(row)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "border-b border-border/80 px-5 py-3.5 text-left text-[13px] font-semibold text-slate-500 dark:text-slate-300",
                        column.className
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="bg-white transition hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900/40">
                    {columns.map((column) => (
                      <td key={column.key} className="px-5 py-4 align-top text-sm">
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="px-5 py-12 text-center">
          <div className="font-display text-xl font-bold">{emptyTitle}</div>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyDescription}</div>
        </div>
      )}
    </Card>
  );
}
