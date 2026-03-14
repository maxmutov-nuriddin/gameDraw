import type { PropsWithChildren } from "react";

import { classNames } from "@/utils/classNames";

interface PanelProps extends PropsWithChildren {
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div className={classNames("glass-panel rounded-[28px] border border-white/70 shadow-panel", className)}>
      {children}
    </div>
  );
}
