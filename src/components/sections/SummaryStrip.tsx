import type { ReactNode } from "react";

export function SummaryStrip({ children }: { children: ReactNode }) {
  return <div className="summary-strip">{children}</div>;
}
