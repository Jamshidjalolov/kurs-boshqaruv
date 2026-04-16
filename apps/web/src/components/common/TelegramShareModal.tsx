import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { AppModal } from "./AppModal";
import { Button } from "./Button";

interface TelegramShareModalProps {
  open: boolean;
  studentName: string;
  parentName: string;
  connectUrl?: string | null;
  onClose: () => void;
}

export function TelegramShareModal({
  open,
  studentName,
  parentName,
  connectUrl,
  onClose
}: TelegramShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let active = true;

    if (!open || !connectUrl) {
      setQrDataUrl("");
      return () => {
        active = false;
      };
    }

    QRCode.toDataURL(connectUrl, {
      width: 360,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((value: string) => {
        if (active) {
          setQrDataUrl(value);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl("");
        }
      });

    return () => {
      active = false;
    };
  }, [connectUrl, open]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`${studentName} uchun Telegram ulash`}
      description={`${parentName} uchun link yoki QR code yuboring. Ota-ona shu QR yoki link bilan botni ochib Start bosadi.`}
      eyebrow="Telegram ulash"
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Yopish
          </Button>
          {connectUrl ? (
            <>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  void navigator.clipboard.writeText(connectUrl);
                  toast.success("Telegram ulash linki nusxalandi.");
                }}
              >
                <Copy size={16} />
                Ulash linki
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => window.open(connectUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink size={16} />
                Botni ochish
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      {connectUrl ? (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-[30px] border border-border/80 bg-[linear-gradient(180deg,#eff6ff,#ffffff)] p-5 dark:bg-[linear-gradient(180deg,#0f172a,#020617)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
              <QrCode size={14} />
              QR code
            </div>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-border/80 bg-white p-4 shadow-sm dark:bg-slate-950">
              {qrDataUrl ? <img src={qrDataUrl} alt="Telegram QR code" className="w-full rounded-[18px]" /> : <div className="py-16 text-center text-sm text-slate-500">QR tayyorlanmoqda...</div>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[28px] border border-border/80 bg-slate-50/90 p-5 dark:bg-slate-950/70">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qadamlar</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <div>1. Ota-onaga QR code yoki linkni yuboring.</div>
                <div>2. U botni aynan shu link bilan ochsin.</div>
                <div>3. Bot ichida `Start` bossin.</div>
                <div>4. Shundan keyin student ro'yxatida holat avtomatik yangilanadi.</div>
              </div>
            </div>
            <div className="rounded-[28px] border border-border/80 bg-white/90 p-5 dark:bg-slate-950/70">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Telegram ulash linki</div>
              <div className="mt-3 break-all rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {connectUrl}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-border px-4 py-10 text-center text-sm text-slate-500">
          Bot username yozilmagani uchun ulash linki tayyor emas.
        </div>
      )}
    </AppModal>
  );
}
