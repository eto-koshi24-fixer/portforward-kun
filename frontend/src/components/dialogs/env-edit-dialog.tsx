"use client";

import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { EnvConfig } from "@/lib/types";

interface Props {
  ref: RefObject<DialogHandle | null>;
  editingKey: string;
  envConfig: EnvConfig | null;
  onSave: (key: string, data: Partial<EnvConfig>) => void;
}

export function EnvEditDialog({ ref, editingKey, envConfig, onSave }: Props) {
  const [envKey, setEnvKey] = useState("");
  const [accessType, setAccessType] = useState("private");
  const [profile, setProfile] = useState("");
  const [accountId, setAccountId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [tagValue, setTagValue] = useState("");

  const isEdit = !!editingKey;

  useEffect(() => {
    setEnvKey(editingKey);
    setAccessType(envConfig?.AccessType || "private");
    setProfile(envConfig?.Profile || "");
    setAccountId(envConfig?.AccountId || "");
    setRoleName(envConfig?.RoleName || "");
    setTagValue(envConfig?.EnvTagValue || "");
  }, [editingKey, envConfig]);

  return (
    <Dialog
      ref={ref}
      title={isEdit ? "環境の編集" : "環境の追加"}
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
              const key = envKey.trim();
              if (!key) return;
              ref.current?.closeDialog();
              const body: Partial<EnvConfig> = { AccessType: accessType };
              if (accessType === "private") {
                body.Profile = profile || null;
                body.AccountId = accountId || null;
                body.RoleName = roleName || null;
                body.EnvTagValue = tagValue || null;
              }
              onSave(key, body);
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <Label htmlFor="env-key" required>
          環境キー
        </Label>
        <Input
          id="env-key"
          value={envKey}
          onChange={(e) => setEnvKey(e.target.value)}
          disabled={isEdit}
          inputSize="sm"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="env-access-type">アクセスタイプ</Label>
        <Select
          id="env-access-type"
          value={accessType}
          onChange={(e) => setAccessType(e.target.value)}
          selectSize="sm"
        >
          <option value="private">private</option>
          <option value="public">public</option>
        </Select>
      </div>
      {accessType === "private" && (
        <>
          <div className="mb-4">
            <Label htmlFor="env-profile">Profile</Label>
            <Input
              id="env-profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              inputSize="sm"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="env-account-id">Account ID</Label>
            <Input
              id="env-account-id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              inputSize="sm"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="env-role-name">Role Name</Label>
            <Input
              id="env-role-name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              inputSize="sm"
            />
          </div>
          <div>
            <Label htmlFor="env-tag-value">Env Tag Value</Label>
            <Input
              id="env-tag-value"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              inputSize="sm"
            />
          </div>
        </>
      )}
    </Dialog>
  );
}
