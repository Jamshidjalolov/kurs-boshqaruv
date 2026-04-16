import { forwardRef, type SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, children, ...props }, ref) => {
    return (
      <label className="space-y-2.5">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <select
          ref={ref}
          className="h-12 w-full rounded-2xl border border-white/60 bg-white/80 px-4 text-sm shadow-soft outline-none transition-all duration-300 focus:border-primary/30 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.08)] dark:border-white/10 dark:bg-slate-950/60"
          {...props}
        >
          {children}
        </select>
        {error ? <span className="text-xs text-rose-500">{error}</span> : null}
      </label>
    );
  }
);

FormSelect.displayName = "FormSelect";
