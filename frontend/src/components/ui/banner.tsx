"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface BannerProps {
  variant?: "warning";
  children: ReactNode;
}

export function Banner({ children }: BannerProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-md text-sm leading-[1.6] bg-warning-bg text-text-primary border border-warning">
      <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warning" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
