"use client";

import type { RefObject } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";

interface Props {
  ref: RefObject<DialogHandle | null>;
  envKey: string;
  onConfirm: () => void;
}

export function EnvDeleteDialog({ ref, envKey, onConfirm }: Props) {
  return (
    <Dialog
      ref={ref}
      title="環境の削除"
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
        環境 <strong>{envKey}</strong>{" "}
        を削除しますか？関連するDBインスタンスと接続情報も削除されます。
      </Banner>
    </Dialog>
  );
}
