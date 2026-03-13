"use client";

import type { HTMLAttributes } from "react";

type ChipColor = "green" | "gray" | "red" | "blue" | "yellow";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  color: ChipColor;
}

const colorClasses: Record<ChipColor, string> = {
  green: "text-success-text bg-success-bg",
  gray: "text-text-secondary bg-gray-50",
  red: "text-error-text bg-error-bg",
  blue: "text-primary bg-chip-blue-bg",
  yellow: "text-warning bg-warning-bg",
};

export function Chip({ color, className = "", children, ...props }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[13px] font-semibold leading-[1.4] whitespace-nowrap rounded-lg min-h-8 ${colorClasses[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
