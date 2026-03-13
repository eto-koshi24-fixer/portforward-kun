"use client";

import { type RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  ref: RefObject<DialogHandle | null>;
  onConfirm: (startPort: number, sessionCount: number) => void;
}

export function MultiSsmDialog({ ref, onConfirm }: Props) {
  const [startPort, setStartPort] = useState("13380");
  const [sessionCount, setSessionCount] = useState("3");

  return (
    <Dialog
      ref={ref}
      title="マルチSSM接続"
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
              onConfirm(
                Number.parseInt(startPort, 10) || 13380,
                Number.parseInt(sessionCount, 10) || 3,
              );
            }}
          >
            接続開始
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <Label htmlFor="multi-start-port">開始ポート</Label>
        <Input
          id="multi-start-port"
          type="number"
          value={startPort}
          onChange={(e) => setStartPort(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div>
        <Label htmlFor="multi-session-count">セッション数</Label>
        <Input
          id="multi-session-count"
          type="number"
          value={sessionCount}
          onChange={(e) => setSessionCount(e.target.value)}
          inputSize="sm"
        />
      </div>
    </Dialog>
  );
}
