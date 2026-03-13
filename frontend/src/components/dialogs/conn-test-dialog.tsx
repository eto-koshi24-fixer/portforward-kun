"use client";

import { Check, X } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { TestStep } from "@/lib/types";

interface Props {
  ref: RefObject<DialogHandle | null>;
  steps: TestStep[];
  testing: boolean;
  onRetest: () => void;
}

const stepNames = ["AWS CLI", "SSO ログイン", "Bastion 解決", "RDS 到達確認"];

export function ConnTestDialog({ ref, steps, testing, onRetest }: Props) {
  return (
    <Dialog
      ref={ref}
      title="接続テスト"
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => ref.current?.closeDialog()}
          >
            閉じる
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetest}
            aria-disabled={testing}
          >
            再テスト
          </Button>
        </div>
      }
    >
      <ul className="list-none p-0 m-0 flex flex-col">
        {stepNames.map((name, i) => {
          const step = steps.find((s) => s.step === i + 1);
          const status = step?.status;

          return (
            <li
              key={name}
              className="flex items-start gap-3 py-3 border-b border-border last:border-b-0 relative"
            >
              <div className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full z-[1]">
                {status === "success" ? (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-success text-white">
                    <Check size={14} />
                  </span>
                ) : status === "error" ? (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-error text-white">
                    <X size={14} />
                  </span>
                ) : testing && !step ? (
                  <Spinner size={20} />
                ) : (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-text-secondary text-[13px] font-semibold">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 flex items-center justify-between gap-2 pt-0.5">
                <span
                  className={`text-[15px] font-semibold ${!step && !testing ? "text-text-disabled" : "text-text-primary"}`}
                >
                  {name}
                </span>
                {status === "success" && (
                  <span className="text-sm text-success font-medium">成功</span>
                )}
                {status === "error" && (
                  <span className="text-sm text-error font-medium">エラー</span>
                )}
                {status === "skipped" && (
                  <span className="text-sm text-text-disabled font-medium">
                    スキップ
                  </span>
                )}
              </div>
              {status === "error" && step?.message && (
                <div className="mt-2 p-2 bg-error-bg border border-error rounded-sm text-xs text-text-primary font-mono whitespace-pre-wrap break-all">
                  {step.message}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
