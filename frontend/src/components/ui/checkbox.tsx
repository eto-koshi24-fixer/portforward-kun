"use client";

import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  size?: "sm" | "md";
}

export function Checkbox({
  label,
  size = "md",
  className = "",
  ...props
}: CheckboxProps) {
  const boxSize = size === "sm" ? "w-[18px] h-[18px]" : "w-5 h-5";

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <input
        type="checkbox"
        className="absolute opacity-0 w-0 h-0 peer"
        {...props}
      />
      <span
        className={`inline-flex items-center justify-center ${boxSize} border-2 border-border-medium rounded-sm bg-white transition-[background-color,border-color] duration-150 ease-in-out peer-checked:bg-primary peer-checked:border-primary peer-checked:[&>.check-icon]:block peer-focus-visible:outline-4 peer-focus-visible:outline-black peer-focus-visible:outline-offset-2 peer-focus-visible:shadow-[0_0_0_2px_#FFD43D] hover:border-border-hover shrink-0`}
        aria-hidden="true"
      >
        <svg
          className="check-icon hidden text-white"
          width="12"
          height="10"
          viewBox="0 0 12 10"
          fill="none"
        >
          <path
            d="M1 5L4.5 8.5L11 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  );
}
