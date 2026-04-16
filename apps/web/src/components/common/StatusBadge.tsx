import type { AttendanceStatus, PaymentStatus } from "@/types/domain";
import { AlertCircle, CheckCircle2, CircleEllipsis, Clock3, Link2, Link2Off, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";

const styles: Record<string, string> = {
  paid: "border-emerald-200 bg-emerald-500/12 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300",
  unpaid: "border-amber-200 bg-amber-500/12 text-amber-700 dark:border-amber-900/60 dark:text-amber-300",
  partial: "border-sky-200 bg-sky-500/12 text-sky-700 dark:border-sky-900/60 dark:text-sky-300",
  overdue: "border-rose-200 bg-rose-500/12 text-rose-700 dark:border-rose-900/60 dark:text-rose-300",
  present: "border-emerald-200 bg-emerald-500/12 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300",
  absent: "border-rose-200 bg-rose-500/12 text-rose-700 dark:border-rose-900/60 dark:text-rose-300",
  late: "border-amber-200 bg-amber-500/12 text-amber-700 dark:border-amber-900/60 dark:text-amber-300",
  excused: "border-sky-200 bg-sky-500/12 text-sky-700 dark:border-sky-900/60 dark:text-sky-300",
  not_prepared: "border-amber-200 bg-amber-500/12 text-amber-700 dark:border-amber-900/60 dark:text-amber-300",
  homework_not_done: "border-orange-200 bg-orange-500/12 text-orange-700 dark:border-orange-900/60 dark:text-orange-300",
  connected: "border-emerald-200 bg-emerald-500/12 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300",
  missing: "border-slate-200 bg-slate-500/12 text-slate-700 dark:border-slate-800 dark:text-slate-300",
  submitted: "border-emerald-200 bg-emerald-500/12 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300",
  pending: "border-amber-200 bg-amber-500/12 text-amber-700 dark:border-amber-900/60 dark:text-amber-300",
  sent: "border-emerald-200 bg-emerald-500/12 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300",
  failed: "border-rose-200 bg-rose-500/12 text-rose-700 dark:border-rose-900/60 dark:text-rose-300"
};

interface StatusBadgeProps {
  status: PaymentStatus | AttendanceStatus | "connected" | "missing" | "submitted" | "pending" | "sent" | "failed";
}

const labels: Record<StatusBadgeProps["status"], string> = {
  paid: "to'langan",
  unpaid: "to'lanmagan",
  partial: "qisman to'langan",
  overdue: "muddati o'tgan",
  present: "keldi",
  absent: "kelmadi",
  late: "kechikdi",
  excused: "sababli kelmadi",
  not_prepared: "tayyor emas",
  homework_not_done: "uy vazifasi qilinmagan",
  connected: "ulangan",
  missing: "ulanmagan",
  submitted: "topshirilgan",
  pending: "kutilmoqda",
  sent: "yuborildi",
  failed: "yuborilmadi"
};

const icons: Record<StatusBadgeProps["status"], typeof CheckCircle2> = {
  paid: CheckCircle2,
  unpaid: ShieldAlert,
  partial: CircleEllipsis,
  overdue: AlertCircle,
  present: CheckCircle2,
  absent: AlertCircle,
  late: Clock3,
  excused: CircleEllipsis,
  not_prepared: ShieldAlert,
  homework_not_done: ShieldAlert,
  connected: Link2,
  missing: Link2Off,
  submitted: CheckCircle2,
  pending: Clock3,
  sent: CheckCircle2,
  failed: AlertCircle
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const Icon = icons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize tracking-[0.04em]",
        styles[status]
      )}
    >
      <Icon size={12} />
      {labels[status]}
    </span>
  );
}
