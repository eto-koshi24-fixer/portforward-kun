"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "solid-fill"
  | "outline"
  | "text"
  | "delete"
  | "danger-text";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-14 min-w-14 px-7 text-lg leading-none",
  md: "h-12 min-w-12 px-6 text-base leading-none",
  sm: "h-9 min-w-9 px-4 text-sm leading-none",
  xs: "h-[30px] min-w-[30px] px-2 text-[13px] leading-none font-normal rounded-sm",
};

const variantClasses: Record<ButtonVariant, string> = {
  "solid-fill":
    "bg-primary text-white hover:not-aria-disabled:bg-primary-hover hover:not-aria-disabled:[&_.btn-label]:underline active:not-aria-disabled:bg-primary-active aria-disabled:bg-gray-300 aria-disabled:text-white",
  outline:
    "bg-white text-primary border border-current hover:not-aria-disabled:text-primary-hover hover:not-aria-disabled:bg-primary-light hover:not-aria-disabled:[&_.btn-label]:underline active:not-aria-disabled:text-primary-active aria-disabled:bg-white aria-disabled:text-gray-300 aria-disabled:border-gray-300",
  text: "bg-transparent text-primary underline hover:not-aria-disabled:bg-btn-text-hover active:not-aria-disabled:bg-btn-text-active aria-disabled:bg-transparent aria-disabled:text-gray-300",
  delete:
    "bg-error text-white hover:not-aria-disabled:bg-error-hover hover:not-aria-disabled:[&_.btn-label]:underline active:not-aria-disabled:bg-error-active aria-disabled:bg-gray-300 aria-disabled:text-white",
  "danger-text":
    "bg-transparent text-error hover:not-aria-disabled:text-error-hover hover:not-aria-disabled:bg-error-bg hover:not-aria-disabled:[&_.btn-label]:underline aria-disabled:bg-transparent aria-disabled:text-gray-300",
};

export function Button({
  variant = "solid-fill",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled =
    props["aria-disabled"] === true || props["aria-disabled"] === "true";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-bold tracking-[0.02rem] rounded-lg cursor-pointer whitespace-nowrap border-none transition-[background-color,color,border-color] duration-150 ease-in-out focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-2 focus-visible:shadow-[0_0_0_2px_#FFD43D] aria-disabled:cursor-default aria-disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={isDisabled ? undefined : props.onClick}
      {...props}
    >
      <span className="btn-label inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}
