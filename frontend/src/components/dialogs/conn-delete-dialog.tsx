"use client";

import type { RefObject } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";

interface Props {
  ref: RefObject<DialogHandle | null>;
  connName: string;
  onConfirm: () => void;
}

export function ConnDeleteDialog({ ref, connName, onConfirm }: Props) {
  return (
    <Dialog
      ref={ref}
      title="接続情報の削除"
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
            削除
          </Button>
        </>
      }
    >
      <Banner>
        接続情報 <strong>{connName}</strong> を削除しますか？
      </Banner>
    </Dialog>
  );
}
