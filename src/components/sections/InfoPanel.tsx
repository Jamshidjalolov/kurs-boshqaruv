import type { ReactNode } from "react";
import { Card } from "@/components/common/Card";

interface InfoPanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function InfoPanel({ title, description, action, children, className }: InfoPanelProps) {
  return (
    <Card className={`space-y-4 ${className ?? ""}`.trim()}>
      <div className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="panel-title">{title}</h3>
          {description ? <p className="panel-caption">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </Card>
  );
}
