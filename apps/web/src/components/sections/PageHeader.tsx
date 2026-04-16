import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  metaTitle?: string;
  metaDescription?: string;
  breadcrumbs?: string[];
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  metaTitle,
  metaDescription,
  breadcrumbs
}: PageHeaderProps) {
  return (
    <div className="page-header-shell">
      <div className="page-header-main">
        <div className="relative z-[1]">
          {breadcrumbs?.length ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {breadcrumbs.map((item, index) => (
                <div key={`${item}-${index}`} className="inline-flex items-center gap-2">
                  {index > 0 ? <ChevronRight size={12} /> : null}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-primary">
                {eyebrow}
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            {action ? <div className="flex flex-wrap gap-3 lg:justify-end">{action}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
