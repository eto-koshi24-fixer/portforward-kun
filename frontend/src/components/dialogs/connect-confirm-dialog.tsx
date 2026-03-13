"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";

interface Props {
  ref: RefObject<DialogHandle | null>;
  targetName: string;
  onConfirm: () => void;
}

export function ConnectConfirmDialog({ ref, targetName, onConfirm }: Props) {
  return (
    <Dialog
      ref={ref}
      title="接続の確認"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ref.current?.closeDialog()}
          >
            キャンセル
          </Button>
          <Button
            variant="solid-fill"
            size="sm"
            onClick={() => {
              ref.current?.closeDialog();
              onConfirm();
            }}
          >
            接続
          </Button>
        </>
      }
    >
      <p>
        <strong>{targetName}</strong> に接続しますか？
      </p>
    </Dialog>
  );
}
