import type { ReactNode } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  eyebrow = "Tasdiqlash",
  confirmLabel = "Tasdiqlash",
  cancelLabel = "Bekor qilish",
  confirmVariant = "danger",
  children,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <Card className="dialog-card w-full max-w-md space-y-5 rounded-t-[32px] border border-white/70 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:rounded-[32px] sm:p-6 dark:border-white/10 dark:bg-slate-950/95">
        <div>
          <div className="section-kicker">{eyebrow}</div>
          <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {children ? <div>{children}</div> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} className="w-full sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
