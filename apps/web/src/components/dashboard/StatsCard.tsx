import {
  Banknote,
  BookOpenCheck,
  BriefcaseBusiness,
  CreditCard,
  GraduationCap,
  TriangleAlert,
  UserRoundCheck,
  Users
} from "lucide-react";
import type { DashboardMetric } from "@/types/domain";
import { Card } from "@/components/common/Card";
import { cn } from "@/lib/cn";

const iconTones: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300"
};

const noteTones: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  primary: "border-primary/15 bg-primary/5 text-primary",
  success: "border-emerald-500/15 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/15 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  danger: "border-rose-500/15 bg-rose-500/5 text-rose-700 dark:text-rose-300"
};

const meterTones: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  primary: "bg-primary/80",
  success: "bg-emerald-500/80",
  warning: "bg-amber-500/80",
  danger: "bg-rose-500/80"
};

const surfaceTones: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  primary: "from-primary/10 via-white to-sky-100/70 dark:from-primary/15 dark:via-slate-950 dark:to-slate-900",
  success: "from-emerald-500/10 via-white to-emerald-100/70 dark:from-emerald-500/15 dark:via-slate-950 dark:to-slate-900",
  warning: "from-amber-500/10 via-white to-amber-100/70 dark:from-amber-500/15 dark:via-slate-950 dark:to-slate-900",
  danger: "from-rose-500/10 via-white to-rose-100/70 dark:from-rose-500/15 dark:via-slate-950 dark:to-slate-900"
};

function splitMoneyValue(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(.*?)(?:\s+(so'm))$/i);

  if (!match) {
    return null;
  }

  return {
    amount: match[1]?.trim() ?? normalized,
    currency: match[2]
  };
}

function resolveMetricIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("o'quvchilar")) return Users;
  if (normalized.includes("o'qituvchilar")) return GraduationCap;
  if (normalized.includes("tushum") || normalized.includes("revenue")) return Banknote;
  if (normalized.includes("to'lov")) return CreditCard;
  if (normalized.includes("guruh")) return BriefcaseBusiness;
  if (normalized.includes("davomat")) return UserRoundCheck;
  if (normalized.includes("kelmagan") || normalized.includes("qarzdor") || normalized.includes("xavf")) return TriangleAlert;
  return BookOpenCheck;
}

export function StatsCard({ label, value, change, tone = "primary" }: DashboardMetric) {
  const Icon = resolveMetricIcon(label);
  const insight = change ?? "Joriy ko'rsatkich yangilandi";
  const moneyValue = splitMoneyValue(value);
  const isLongValue = !moneyValue && value.length > 10;

  return (
    <Card className={cn("stats-card relative overflow-hidden border-0 bg-gradient-to-br p-0 shadow-[0_18px_34px_rgba(15,23,42,0.05)]", surfaceTones[tone])}>
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/70 blur-2xl dark:bg-white/5" />
      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="stats-card__label text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
            <div className="mt-4 min-w-0">
              {moneyValue ? (
                <div className="stats-card__money-row">
                  <div className="stats-card__value stats-card__value--money">{moneyValue.amount}</div>
                  <span className={cn("stats-card__currency", noteTones[tone])}>{moneyValue.currency}</span>
                </div>
              ) : (
                <div
                  className={cn(
                    "stats-card__value text-slate-950 dark:text-white",
                    isLongValue ? "text-[2rem] sm:text-[2.15rem]" : "text-[2.35rem] sm:text-[2.7rem]"
                  )}
                >
                  {value}
                </div>
              )}
            </div>
          </div>
          <div className={cn("stats-card__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border shadow-sm", iconTones[tone])}>
            <Icon size={18} />
          </div>
        </div>

        <div className={cn("mt-5 rounded-[20px] border px-3.5 py-3 text-sm leading-6 shadow-sm", noteTones[tone])}>
          {insight}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 flex-[1.3] rounded-full", meterTones[tone])} />
          <span className={cn("h-1.5 flex-1 rounded-full opacity-80", meterTones[tone])} />
          <span className="h-1.5 flex-[0.7] rounded-full bg-slate-200/80 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </Card>
  );
}
