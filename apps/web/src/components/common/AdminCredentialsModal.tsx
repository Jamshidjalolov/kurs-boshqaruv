import { Copy, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./Button";
import { AppModal } from "./AppModal";

interface AdminCredentialsModalProps {
  open: boolean;
  title: string;
  description: string;
  loginIdentifier: string;
  password: string;
  onClose: () => void;
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} nusxalandi.`);
  } catch {
    toast.error(`${label} ni nusxalab bo'lmadi.`);
  }
}

export function AdminCredentialsModal({
  open,
  title,
  description,
  loginIdentifier,
  password,
  onClose
}: AdminCredentialsModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="Faqat admin uchun"
      title={title}
      description={description}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Yopish
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="admin-secret-card">
          <div className="admin-secret-card__header">
            <div className="admin-secret-card__icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="font-semibold text-slate-950 dark:text-white">Login ma'lumoti tayyor</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Bu ma'lumotni faqat admin ko'radi va foydalanuvchiga beradi.</div>
            </div>
          </div>
          <div className="admin-secret-grid">
            <div className="admin-secret-item">
              <div className="admin-secret-item__label">
                <UserRound size={14} />
                Login
              </div>
              <div className="admin-secret-item__value">{loginIdentifier}</div>
              <Button variant="secondary" size="sm" onClick={() => void copyText(loginIdentifier, "Login")} className="w-full">
                <Copy size={14} />
                Nusxalash
              </Button>
            </div>
            <div className="admin-secret-item">
              <div className="admin-secret-item__label">
                <KeyRound size={14} />
                Parol
              </div>
              <div className="admin-secret-item__value">{password}</div>
              <Button variant="secondary" size="sm" onClick={() => void copyText(password, "Parol")} className="w-full">
                <Copy size={14} />
                Nusxalash
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
}
