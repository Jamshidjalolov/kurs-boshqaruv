import { cn } from "@/lib/cn";

interface AttendanceNotesProps {
  comment?: string | null;
  homeworkComment?: string | null;
  dailyGradeComment?: string | null;
  emptyLabel?: string | null;
  compact?: boolean;
  className?: string;
}

export function AttendanceNotes({
  comment,
  homeworkComment,
  dailyGradeComment,
  emptyLabel = "Izoh yo'q",
  compact = false,
  className
}: AttendanceNotesProps) {
  const items = [
    comment ? { key: "attendance", label: "Davomat izohi", value: comment } : null,
    homeworkComment ? { key: "homework", label: "Uy vazifasi izohi", value: homeworkComment } : null,
    dailyGradeComment ? { key: "daily-grade", label: "Kunlik baho izohi", value: dailyGradeComment } : null
  ].filter(Boolean) as Array<{ key: string; label: string; value: string }>;

  if (!items.length) {
    if (!emptyLabel) {
      return null;
    }

    return (
      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-slate-50/90 text-slate-500 dark:bg-slate-900/70 dark:text-slate-300",
          compact ? "px-3 py-2 text-xs" : "px-3 py-2 text-sm",
          className
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            "rounded-2xl border border-border/70 bg-slate-50/90 dark:bg-slate-900/70",
            compact ? "px-3 py-2" : "px-3 py-2.5"
          )}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
          <div
            className={cn(
              "mt-1 break-words whitespace-pre-wrap text-slate-600 dark:text-slate-300",
              compact ? "text-xs leading-5" : "text-sm leading-6"
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
