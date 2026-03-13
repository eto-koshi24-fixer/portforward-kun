"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "sm" | "md";
  error?: boolean;
  supportText?: string;
}

export function Input({
  inputSize = "md",
  error = false,
  supportText,
  className = "",
  ...props
}: InputProps) {
  const sizeClass =
    inputSize === "sm" ? "py-1.5 px-2.5 text-sm" : "py-2.5 px-3 text-base";

  return (
    <div>
      <input
        className={`block w-full font-sans text-text-primary bg-white border rounded-sm transition-[border-color] duration-150 ease-in-out hover:border-border-hover focus:outline-4 focus:outline-black focus:outline-offset-2 focus:shadow-[0_0_0_2px_#FFD43D] focus:border-border-focus disabled:bg-gray-50 disabled:text-text-disabled disabled:cursor-not-allowed ${sizeClass} ${error ? "border-border-error" : "border-border-medium"} ${className}`}
        {...props}
      />
      {supportText && (
        <span className="block text-[13px] mt-1 text-error-text">
          {supportText}
        </span>
      )}
    </div>
  );
}
