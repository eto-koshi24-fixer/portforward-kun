import type { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  required = false,
  className = "",
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm font-semibold text-text-primary mb-1 leading-[1.3] ${className}`}
      {...props}
    >
      {children}
      {required && (
        <span className="inline-block ml-1 px-1.5 py-px text-[11px] font-semibold text-error-text bg-error-bg rounded-sm">
          必須
        </span>
      )}
    </label>
  );
}
