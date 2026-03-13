"use client";

import type { RefObject } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";

interface Props {
  ref: RefObject<DialogHandle | null>;
  connectedCount: number;
  onConfirm: () => void;
}

export function DisconnectAllDialog({ ref, connectedCount, onConfirm }: Props) {
  return (
    <Dialog
      ref={ref}
      title="全切断の確認"
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
            全切断
          </Button>
        </>
      }
    >
      <Banner>
        現在 <strong>{connectedCount}</strong>{" "}
        件の接続があります。すべて切断しますか？
      </Banner>
    </Dialog>
  );
}
