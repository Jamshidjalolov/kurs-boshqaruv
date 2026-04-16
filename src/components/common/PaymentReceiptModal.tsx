import { AppModal } from "./AppModal";
import { Button } from "./Button";
import type { PaymentReceipt } from "@/types/domain";

interface PaymentReceiptModalProps {
  open: boolean;
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildReceiptHtml(receipt: PaymentReceipt) {
  const safeReceipt = {
    studentName: escapeHtml(receipt.studentName),
    month: escapeHtml(receipt.month),
    paidAt: escapeHtml(receipt.paidAt),
    receiptNumber: escapeHtml(receipt.receiptNumber),
    receivedAmount: escapeHtml(receipt.receivedAmount),
    totalPaid: escapeHtml(receipt.totalPaid),
    expectedAmount: escapeHtml(receipt.expectedAmount),
    remainingAmount: escapeHtml(receipt.remainingAmount),
    statusNote: escapeHtml(receipt.statusNote),
    method: escapeHtml(receipt.method)
  };

  return `<!doctype html>
  <html lang="uz">
    <head>
      <meta charset="utf-8" />
      <title>To'lov cheki</title>
      <style>
        body { font-family: "Segoe UI", Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a; }
        .receipt { max-width: 560px; margin: 0 auto; background: white; border: 1px solid #cbd5e1; border-radius: 20px; padding: 24px; }
        .eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #2563eb; font-weight: 700; }
        h1 { margin: 10px 0 0; font-size: 28px; }
        .meta { margin-top: 6px; color: #64748b; font-size: 13px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #f8fafc; }
        .label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .value { margin-top: 8px; font-size: 18px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="eyebrow">To'lov cheki</div>
        <h1>${safeReceipt.studentName}</h1>
        <div class="meta">${safeReceipt.month} | ${safeReceipt.paidAt} | ${safeReceipt.receiptNumber}</div>
        <div class="grid">
          <div class="card"><div class="label">Qabul qilingan</div><div class="value">${safeReceipt.receivedAmount}</div></div>
          <div class="card"><div class="label">Jami to'langan</div><div class="value">${safeReceipt.totalPaid}</div></div>
          <div class="card"><div class="label">Oylik</div><div class="value">${safeReceipt.expectedAmount}</div></div>
          <div class="card"><div class="label">Qolgan qarz</div><div class="value">${safeReceipt.remainingAmount}</div></div>
          <div class="card"><div class="label">Holat</div><div class="value">${safeReceipt.statusNote}</div></div>
          <div class="card"><div class="label">Usul</div><div class="value">${safeReceipt.method}</div></div>
        </div>
      </div>
      <script>window.print();</script>
    </body>
  </html>`;
}

export function PaymentReceiptModal({ open, receipt, onClose }: PaymentReceiptModalProps) {
  if (!receipt) {
    return null;
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="To'lov cheki"
      description="Qabul qilingan summa va qolgan qarz shu chekda ko'rinadi."
      eyebrow="Receipt"
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Yopish
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              const popup = window.open("", "_blank", "noopener,noreferrer,width=760,height=880");
              if (!popup) {
                return;
              }

              popup.document.write(buildReceiptHtml(receipt));
              popup.document.close();
            }}
          >
            Chekni chiqarish
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[22px] border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">O'quvchi</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{receipt.studentName}</div>
          <div className="mt-1 text-sm text-slate-500">{receipt.month}</div>
        </div>
        <div className="rounded-[22px] border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Chek raqami</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{receipt.receiptNumber}</div>
          <div className="mt-1 text-sm text-slate-500">{receipt.paidAt}</div>
        </div>
        <div className="rounded-[22px] border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Qabul qilingan</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{receipt.receivedAmount}</div>
        </div>
        <div className="rounded-[22px] border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Jami to'langan</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{receipt.totalPaid}</div>
        </div>
        <div className="rounded-[22px] border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Qolgan qarz</div>
          <div className="mt-2 text-lg font-semibold text-rose-600 dark:text-rose-300">{receipt.remainingAmount}</div>
        </div>
        <div className="rounded-[22px] border border-border/80 bg-slate-50/80 p-4 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Holat</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{receipt.statusNote}</div>
          <div className="mt-1 text-sm text-slate-500">{receipt.method}</div>
        </div>
      </div>
    </AppModal>
  );
}
