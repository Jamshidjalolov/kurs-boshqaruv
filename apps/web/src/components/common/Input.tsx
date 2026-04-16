import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-border/80 bg-white px-4 text-sm text-foreground shadow-sm outline-none ring-0 transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-slate-950",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
