import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./Card";

interface AppModalProps {
  open: boolean;
  title: string;
  description?: string;
  eyebrow?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

const sizeClassMap = {
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl"
} as const;

export function AppModal({
  open,
  title,
  description,
  eyebrow = "Boshqaruv",
  size = "lg",
  children,
  footer,
  onClose
}: AppModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <Card className={`dialog-card modal-shell modal-shell--${size} ${sizeClassMap[size]} h-[100dvh] max-h-[100dvh] w-full rounded-none p-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[34px]`}>
        <div className="modal-shell__header">
          <div>
            <div className="section-kicker">{eyebrow}</div>
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">{title}</h3>
            {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="modal-shell__close" aria-label="Modalni yopish">
            <X size={18} />
          </button>
        </div>
        <div className="modal-shell__body">{children}</div>
        {footer ? <div className="modal-shell__footer">{footer}</div> : null}
      </Card>
    </div>
  );
}
