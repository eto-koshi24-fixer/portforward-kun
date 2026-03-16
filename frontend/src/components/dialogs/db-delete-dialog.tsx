"use client";

import type { RefObject } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";

interface Props {
  ref: RefObject<DialogHandle | null>;
  dbName: string;
  onConfirm: () => void;
}

export function DbDeleteDialog({ ref, dbName, onConfirm }: Props) {
  return (
    <Dialog
      ref={ref}
      title="DBインスタンスの設定を削除"
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
        DBインスタンス <strong>{dbName}</strong> の設定を削除しますか？（実際のRDSには影響しません）
      </Banner>
    </Dialog>
  );
}
