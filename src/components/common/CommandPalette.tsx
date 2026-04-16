import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { mockApi } from "@/services/mock-api";
import { Card } from "./Card";
import { Input } from "./Input";

export function CommandPalette() {
  const open = useAuthStore((state) => state.commandPaletteOpen);
  const toggle = useAuthStore((state) => state.toggleCommandPalette);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ label: string; href: string; type: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape") {
        toggle(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    if (!open || query.trim().length === 0) {
      setResults([]);
      return;
    }

    mockApi.globalSearch(query).then(setResults);
  }, [open, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/45 p-3 pt-16 backdrop-blur-md sm:p-4 sm:pt-24"
      onClick={() => toggle(false)}
    >
      <Card className="w-full max-w-2xl space-y-4 p-4 sm:p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="rounded-[22px] border border-white/55 bg-white/80 p-3 text-primary shadow-soft dark:border-white/10 dark:bg-slate-950/55">
            <Search size={18} />
          </div>
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="O'quvchi, guruh yoki o'qituvchini qidiring..."
          />
          <button
            type="button"
            onClick={() => toggle(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-border/80 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-foreground dark:bg-slate-900 dark:hover:bg-slate-800"
            aria-label="Qidiruv oynasini yopish"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-border px-4 py-8 text-sm text-slate-500 dark:text-slate-400">
              Qidirish uchun yozishni boshlang.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={`${item.type}-${item.label}`}
                type="button"
                className="flex w-full items-center justify-between rounded-[22px] border border-transparent bg-white/50 px-4 py-3 text-left transition hover:border-white/60 hover:bg-white/80 dark:bg-slate-950/20 dark:hover:border-white/10 dark:hover:bg-slate-900/70"
                onClick={() => {
                  navigate(item.href);
                  toggle(false);
                }}
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.type}</span>
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
