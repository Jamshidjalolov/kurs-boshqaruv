import { Inbox } from "lucide-react";
import { Card } from "./Card";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="relative flex min-h-64 flex-col items-center justify-center gap-4 overflow-hidden text-center">
      <div className="absolute -right-8 top-0 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="rounded-[22px] border border-white/55 bg-white/80 p-4 text-primary shadow-soft dark:border-white/10 dark:bg-slate-950/55">
        <Inbox size={22} />
      </div>
      <div>
        <div className="section-kicker">Bo'sh holat</div>
        <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Card>
  );
}
