"use client";

import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  ref: RefObject<DialogHandle | null>;
  currentPort: number;
  onConfirm: (port: number) => void;
}

export function PortEditDialog({ ref, currentPort, onConfirm }: Props) {
  const [port, setPort] = useState(String(currentPort));

  useEffect(() => {
    setPort(String(currentPort));
  }, [currentPort]);

  const portNum = Number.parseInt(port, 10);
  const isValid = portNum >= 1024 && portNum <= 65535;

  return (
    <Dialog
      ref={ref}
      title="ポート番号の変更"
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
            aria-disabled={!isValid}
            onClick={() => {
              if (!isValid) return;
              ref.current?.closeDialog();
              onConfirm(portNum);
            }}
          >
            変更
          </Button>
        </>
      }
    >
      <div>
        <Label htmlFor="edit-port-number">ポート番号 (1024〜65535)</Label>
        <Input
          id="edit-port-number"
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          inputSize="sm"
          error={port !== "" && !isValid}
          supportText={
            port !== "" && !isValid
              ? "1024〜65535の範囲で入力してください"
              : undefined
          }
        />
      </div>
    </Dialog>
  );
}
