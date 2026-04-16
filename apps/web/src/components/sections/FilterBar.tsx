import type { ReactNode } from "react";

export function FilterBar({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="toolbar-shell flex flex-col gap-4">
      <div className="min-w-0">{children}</div>
      {aside ? <div className="flex flex-wrap gap-2">{aside}</div> : null}
    </div>
  );
}
