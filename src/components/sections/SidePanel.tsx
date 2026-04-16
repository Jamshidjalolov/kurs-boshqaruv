import type { ReactNode } from "react";

interface SidePanelProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SidePanel({ id, title, description, children }: SidePanelProps) {
  return (
    <aside id={id} className="side-panel space-y-4">
      <div className="border-b border-border/80 pb-4">
        <h3 className="panel-title">{title}</h3>
        {description ? <p className="panel-caption">{description}</p> : null}
      </div>
      {children}
    </aside>
  );
}
