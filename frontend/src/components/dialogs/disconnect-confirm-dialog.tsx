"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";

interface Props {
  ref: RefObject<DialogHandle | null>;
  targetName: string;
  onConfirm: () => void;
}

export function DisconnectConfirmDialog({ ref, targetName, onConfirm }: Props) {
  return (
    <Dialog
      ref={ref}
      title="切断の確認"
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
            variant="delete"
            size="sm"
            onClick={() => {
              ref.current?.closeDialog();
              onConfirm();
            }}
          >
            切断
          </Button>
        </>
      }
    >
      <p>
        <strong>{targetName}</strong> を切断しますか？
      </p>
    </Dialog>
  );
}
