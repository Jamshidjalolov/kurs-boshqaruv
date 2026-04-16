import { Button } from "./Button";
import { cn } from "@/lib/cn";

type Tone = "default" | "success" | "warning" | "danger";

interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  tone?: Tone;
}

interface FilterChipsProps<T extends string> {
  value: T;
  options: Array<FilterOption<T>>;
  onChange: (value: T) => void;
}

const toneStyles: Record<Tone, string> = {
  default: "border-border text-slate-500 dark:text-slate-300",
  success: "border-emerald-200 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300",
  warning: "border-amber-200 text-amber-700 dark:border-amber-900/60 dark:text-amber-300",
  danger: "border-rose-200 text-rose-700 dark:border-rose-900/60 dark:text-rose-300"
};

export function FilterChips<T extends string>({ value, options, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Button
            key={option.value}
            variant={active ? "primary" : "ghost"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full",
              !active && "border border-border/80 bg-white text-slate-600 shadow-none dark:bg-slate-950",
              !active && toneStyles[option.tone ?? "default"]
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-slate-900/5 dark:bg-white/10"
                )}
              >
                {option.count}
              </span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
