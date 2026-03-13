"use client";

import { useRef } from "react";
import type { DialogHandle } from "@/components/ui/dialog";

export function useDialog() {
  const ref = useRef<DialogHandle>(null);

  const open = () => ref.current?.showDialog();
  const close = (reason?: string) => ref.current?.closeDialog(reason);

  return { ref, open, close };
}
