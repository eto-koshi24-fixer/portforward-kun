"use client";

import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { DbInstance, FullConfigResponse } from "@/lib/types";

interface Props {
  ref: RefObject<DialogHandle | null>;
  config: FullConfigResponse | null;
  editingEnv: string;
  editingDbId: string;
  onSave: (envKey: string, data: DbInstance) => void;
}

export function DbEditDialog({
  ref,
  config,
  editingEnv,
  editingDbId,
  onSave,
}: Props) {
  const [env, setEnv] = useState("");
  const [dbId, setDbId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("tenant");

  const isEdit = !!editingDbId;
  const envKeys = config ? Object.keys(config.Envs) : [];

  useEffect(() => {
    setEnv(editingEnv);
    if (editingDbId && config) {
      const inst = config.DbInstances?.[editingEnv]?.find(
        (i) => i.id === editingDbId,
      );
      setDbId(inst?.id || "");
      setDisplayName(inst?.display_name || "");
      setCategory(inst?.category || "tenant");
    } else {
      setDbId("");
      setDisplayName("");
      setCategory("tenant");
    }
  }, [editingEnv, editingDbId, config]);

  return (
    <Dialog
      ref={ref}
      title={isEdit ? "DBインスタンスの編集" : "DBインスタンスの追加"}
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
              if (!env.trim() || !dbId.trim()) return;
              ref.current?.closeDialog();
              onSave(env.trim(), {
                id: dbId.trim(),
                display_name: displayName.trim(),
                category,
              });
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <Label htmlFor="db-env" required>
          環境
        </Label>
        <Select
          id="db-env"
          value={env}
          onChange={(e) => setEnv(e.target.value)}
          selectSize="sm"
        >
          <option value="">選択してください</option>
          {envKeys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Label htmlFor="db-instance-id" required>
          DB ID
        </Label>
        <Input
          id="db-instance-id"
          value={dbId}
          onChange={(e) => setDbId(e.target.value)}
          disabled={isEdit}
          inputSize="sm"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="db-display-name">表示名</Label>
        <Input
          id="db-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div>
        <Label htmlFor="db-category">カテゴリ</Label>
        <Select
          id="db-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          selectSize="sm"
        >
          <option value="tenant">テナント</option>
          <option value="common">共通</option>
        </Select>
      </div>
    </Dialog>
  );
}
