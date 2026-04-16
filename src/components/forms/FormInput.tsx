import { forwardRef, type InputHTMLAttributes } from "react";
import { Input } from "@/components/common/Input";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <label className="space-y-2.5">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <Input ref={ref} {...props} />
        {error ? <span className="text-xs text-rose-500">{error}</span> : null}
      </label>
    );
  }
);

FormInput.displayName = "FormInput";
