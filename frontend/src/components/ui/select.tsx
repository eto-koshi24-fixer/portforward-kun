"use client";

import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: "sm" | "md";
}

export function Select({
  selectSize = "sm",
  className = "",
  children,
  ...props
}: SelectProps) {
  const sizeClass =
    selectSize === "sm"
      ? "py-1.5 pr-8 pl-2.5 text-sm"
      : "py-2.5 pr-9 pl-3 text-base";

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        className={`appearance-none font-sans text-text-primary bg-white border border-border-medium rounded-sm cursor-pointer w-full hover:border-border-hover focus:outline-4 focus:outline-black focus:outline-offset-2 focus:shadow-[0_0_0_2px_#FFD43D] focus:border-border-focus ${sizeClass}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary shrink-0"
      />
    </div>
  );
}
