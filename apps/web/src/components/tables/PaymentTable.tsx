import { DataTable } from "./DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { PaymentEntry } from "@/types/domain";

interface PaymentTableProps {
  rows: PaymentEntry[];
}

export function PaymentTable({ rows }: PaymentTableProps) {
  return (
    <DataTable
      title="To'lov nazorati"
      description="Qaysi oy uchun qancha tushgan, qancha qolgani va avtomatik holat shu yerda ko'rinadi."
      rows={rows}
      mobileCardTitle={(row) => row.studentName}
      columns={[
        { key: "student", header: "O'quvchi", render: (row) => row.studentName },
        { key: "month", header: "Oy", render: (row) => row.month },
        {
          key: "amount",
          header: "To'lov",
          render: (row) => (
            <div>
              <div className="font-medium">{row.amount}</div>
              <div className="text-xs text-slate-500">Oylik: {row.expectedAmount ?? "-"}</div>
            </div>
          )
        },
        {
          key: "remaining",
          header: "Qolgan qarz",
          render: (row) => <span className="text-sm font-medium text-rose-600 dark:text-rose-300">{row.remainingAmount ?? "-"}</span>
        },
        { key: "dueDate", header: "Muddat", render: (row) => row.dueDate },
        { key: "method", header: "Usul", render: (row) => row.method },
        {
          key: "status",
          header: "Holat",
          render: (row) => (
            <div className="space-y-1">
              <StatusBadge status={row.status} />
              <div className="text-xs text-slate-500">{row.statusNote ?? "-"}</div>
            </div>
          )
        }
      ]}
    />
  );
}
