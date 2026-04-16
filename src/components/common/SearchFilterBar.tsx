import { Search } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";

interface SearchFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  quickFilterLabel?: string;
  onQuickFilter?: () => void;
}

export function SearchFilterBar({
  value,
  onChange,
  placeholder,
  quickFilterLabel,
  onQuickFilter
}: SearchFilterBarProps) {
  return (
    <div className="rounded-[22px] border border-border/80 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:bg-slate-950">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Qidiruv</div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 pl-11"
            placeholder={placeholder ?? "O'quvchi, guruh yoki to'lovni qidiring..."}
          />
        </div>
        {quickFilterLabel ? (
          <Button variant="secondary" onClick={onQuickFilter} className="h-12 justify-center rounded-[18px] px-5 xl:shrink-0">
            {quickFilterLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
