"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/stores/app-store";

export function Snackbar() {
  const snackbar = useAppStore((s) => s.snackbar);
  const hideSnackbar = useAppStore((s) => s.hideSnackbar);

  if (!snackbar) return null;

  const bgClass =
    snackbar.type === "success"
      ? "bg-success-text"
      : snackbar.type === "error"
        ? "bg-error"
        : "bg-gray-900";

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 text-white rounded-lg shadow-lg text-sm z-[10000] max-w-[560px] animate-[snackbar-slide-up_0.25s_ease-out] ${bgClass}`}
    >
      <span>{snackbar.message}</span>
      <button
        type="button"
        className="bg-transparent border-none text-white text-xl cursor-pointer px-1 opacity-70 hover:opacity-100"
        onClick={hideSnackbar}
      >
        <X size={18} />
      </button>
    </div>
  );
}
