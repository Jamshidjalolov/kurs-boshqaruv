import type { ReactNode } from "react";

interface TimelineItem {
  id: string;
  title: ReactNode;
  description: ReactNode;
  meta?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClasses: Record<NonNullable<TimelineItem["tone"]>, string> = {
  default: "bg-slate-300",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500"
};

export function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="relative pl-6">
          <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${toneClasses[item.tone ?? "default"]}`} />
          <div className="rounded-2xl border border-border/80 bg-slate-50/80 px-4 py-3 dark:bg-slate-900/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</div>
              </div>
              {item.meta ? <div className="shrink-0 text-xs text-slate-400">{item.meta}</div> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
