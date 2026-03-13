"use client";

import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ConnectionConfig, FullConfigResponse } from "@/lib/types";

interface Props {
  ref: RefObject<DialogHandle | null>;
  config: FullConfigResponse | null;
  editingEnv: string;
  editingDbId: string;
  onSave: (
    envKey: string,
    dbId: string,
    data: Partial<ConnectionConfig>,
  ) => void;
  onTestConnection: (env: string, dbId: string) => void;
  testPassed: boolean;
}

export function ConnEditDialog({
  ref,
  config,
  editingEnv,
  editingDbId,
  onSave,
  onTestConnection,
  testPassed,
}: Props) {
  const [env, setEnv] = useState("");
  const [dbId, setDbId] = useState("");
  const [host, setHost] = useState("");
  const [password, setPassword] = useState("");
  const [localPort, setLocalPort] = useState("");

  const isEdit = !!editingDbId;
  const envKeys = config ? Object.keys(config.Envs) : [];
  const dbInstances = config?.DbInstances?.[env] || [];

  useEffect(() => {
    setEnv(editingEnv);
    setDbId(editingDbId);
    if (editingEnv && editingDbId && config) {
      const conn = config.Connections?.[editingEnv]?.[editingDbId];
      setHost(conn?.host || "");
      setPassword(conn?.password || "");
      setLocalPort(conn?.local_port ? String(conn.local_port) : "");
    } else {
      setHost("");
      setPassword("");
      setLocalPort("");
    }
  }, [editingEnv, editingDbId, config]);

  const canSave = isEdit || testPassed;

  return (
    <Dialog
      ref={ref}
      title={isEdit ? "接続情報の編集" : "接続情報の追加"}
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ref.current?.closeDialog()}
          >
            キャンセル
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (env.trim() && dbId.trim()) {
                  onTestConnection(env.trim(), dbId.trim());
                }
              }}
            >
              接続テスト
            </Button>
            <Button
              variant="solid-fill"
              size="sm"
              aria-disabled={!canSave}
              onClick={() => {
                if (!canSave) return;
                if (!env.trim() || !dbId.trim()) return;
                ref.current?.closeDialog();
                const body: Partial<ConnectionConfig> = {
                  host,
                  password,
                };
                const port = Number.parseInt(localPort, 10);
                if (port) body.local_port = port;
                onSave(env.trim(), dbId.trim(), body);
              }}
            >
              保存
            </Button>
          </div>
        </>
      }
    >
      <div className="mb-4">
        <Label htmlFor="conn-env" required>
          環境
        </Label>
        <Select
          id="conn-env"
          value={env}
          onChange={(e) => {
            setEnv(e.target.value);
            setDbId("");
          }}
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
        <Label htmlFor="conn-db" required>
          DB
        </Label>
        <Select
          id="conn-db"
          value={dbId}
          onChange={(e) => setDbId(e.target.value)}
          selectSize="sm"
        >
          <option value="">選択してください</option>
          {dbInstances.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.id} ({inst.display_name})
            </option>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Label htmlFor="conn-host" required>
          ホスト
        </Label>
        <Input
          id="conn-host"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="conn-password" required>
          パスワード
        </Label>
        <Input
          id="conn-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div>
        <Label htmlFor="conn-local-port">ローカルポート</Label>
        <Input
          id="conn-local-port"
          type="number"
          value={localPort}
          onChange={(e) => setLocalPort(e.target.value)}
          inputSize="sm"
          placeholder="自動割当"
        />
      </div>
    </Dialog>
  );
}
