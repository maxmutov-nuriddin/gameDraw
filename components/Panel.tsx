import type { CSSProperties, PropsWithChildren } from "react";

import { classNames } from "@/utils/classNames";

interface PanelProps extends PropsWithChildren {
  className?: string;
  style?: CSSProperties;
}

export function Panel({ children, className, style }: PanelProps) {
  return (
    <div className={classNames("card", className)} style={style}>
      {children}
    </div>
  );
}
