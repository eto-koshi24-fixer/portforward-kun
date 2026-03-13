"use client";

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface DialogHandle {
  showDialog: () => void;
  closeDialog: (reason?: string) => void;
}

interface DialogProps {
  ref?: RefObject<DialogHandle | null>;
  title?: string;
  size?: "sm" | "lg";
  preventClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: (reason: string) => void;
}

export function Dialog({
  ref,
  title,
  size = "sm",
  preventClose = false,
  children,
  footer,
  onClose,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = useCallback(
    (reason = "button") => {
      const el = dialogRef.current;
      if (!el) return;
      el.setAttribute("closing", "");
      const onEnd = () => {
        el.removeAttribute("closing");
        el.close();
        onClose?.(reason);
      };
      el.addEventListener("animationend", onEnd, { once: true });
      // fallback if animation disabled
      setTimeout(() => {
        if (el.hasAttribute("closing")) {
          el.removeAttribute("closing");
          el.close();
          onClose?.(reason);
        }
      }, 300);
    },
    [onClose],
  );

  const show = useCallback(() => {
    const el = dialogRef.current;
    if (!el) return;
    el.showModal();
    const firstFocusable = el.querySelector<HTMLElement>(
      "input:not([disabled]):not([hidden]), select:not([disabled]), button:not([disabled])",
    );
    if (firstFocusable) {
      requestAnimationFrame(() => firstFocusable.focus());
    }
  }, []);

  useImperativeHandle(ref, () => ({ showDialog: show, closeDialog: close }), [
    show,
    close,
  ]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!preventClose) close("escape");
    };

    const handleClick = (e: MouseEvent) => {
      if (e.target === el && !preventClose) close("backdrop");
    };

    el.addEventListener("cancel", handleCancel);
    el.addEventListener("click", handleClick);
    return () => {
      el.removeEventListener("cancel", handleCancel);
      el.removeEventListener("click", handleClick);
    };
  }, [close, preventClose]);

  const widthClass = size === "lg" ? "w-[784px]" : "w-[480px]";

  return (
    <dialog
      ref={dialogRef}
      className={`fixed m-auto p-0 border-none rounded-lg bg-white max-h-[90vh] overflow-visible font-sans focus-visible:outline-none open:animate-[fds-modal-open_0.2s_ease-out] open:backdrop:animate-[fds-backdrop-fade-in_0.2s_ease-out] [&[closing]]:animate-[fds-modal-close_0.15s_ease-in_forwards] [&[closing]]::backdrop:animate-[fds-backdrop-fade-out_0.15s_ease-in_forwards] backdrop:bg-black/50 max-sm:w-[90vw] max-sm:!w-[90vw] ${widthClass} forced-colors:border-2 forced-colors:border-[CanvasText]`}
    >
      <div className="flex flex-col h-fit max-h-[90vh]">
        {title && (
          <div className="px-6 pt-4">
            <h2 className="m-0 text-xl font-bold leading-[1.5] tracking-[0.025rem] text-text-primary">
              {title}
            </h2>
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto text-text-primary text-base leading-[1.5] tracking-[0.02rem]">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 flex justify-between gap-2">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
