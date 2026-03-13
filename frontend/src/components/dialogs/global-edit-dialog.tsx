"use client";

import { type RefObject, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, type DialogHandle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GlobalConfig } from "@/lib/types";

interface Props {
  ref: RefObject<DialogHandle | null>;
  globalConfig: GlobalConfig | null;
  onSave: (data: Partial<GlobalConfig>) => void;
}

export function GlobalEditDialog({ ref, globalConfig, onSave }: Props) {
  const [ssoUrl, setSsoUrl] = useState("");
  const [ssoRegion, setSsoRegion] = useState("ap-northeast-1");
  const [defaultRegion, setDefaultRegion] = useState("ap-northeast-1");
  const [dbPort, setDbPort] = useState("5432");
  const [dbUser, setDbUser] = useState("postgres");

  useEffect(() => {
    if (globalConfig) {
      setSsoUrl(globalConfig.SsoStartUrl || "");
      setSsoRegion(globalConfig.SsoRegion || "ap-northeast-1");
      setDefaultRegion(globalConfig.DefaultRegion || "ap-northeast-1");
      setDbPort(String(globalConfig.DbPort || 5432));
      setDbUser(globalConfig.DbUser || "postgres");
    }
  }, [globalConfig]);

  return (
    <Dialog
      ref={ref}
      title="グローバル設定の編集"
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
              onSave({
                SsoStartUrl: ssoUrl,
                SsoRegion: ssoRegion,
                DefaultRegion: defaultRegion,
                DbPort: Number.parseInt(dbPort, 10) || 5432,
                DbUser: dbUser,
              });
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <Label htmlFor="global-sso-url" required>
          SSO Start URL
        </Label>
        <Input
          id="global-sso-url"
          value={ssoUrl}
          onChange={(e) => setSsoUrl(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="global-sso-region">SSO Region</Label>
        <Input
          id="global-sso-region"
          value={ssoRegion}
          onChange={(e) => setSsoRegion(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="global-default-region">Default Region</Label>
        <Input
          id="global-default-region"
          value={defaultRegion}
          onChange={(e) => setDefaultRegion(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="global-db-port">DB Port</Label>
        <Input
          id="global-db-port"
          type="number"
          value={dbPort}
          onChange={(e) => setDbPort(e.target.value)}
          inputSize="sm"
        />
      </div>
      <div>
        <Label htmlFor="global-db-user">DB User</Label>
        <Input
          id="global-db-user"
          value={dbUser}
          onChange={(e) => setDbUser(e.target.value)}
          inputSize="sm"
        />
      </div>
    </Dialog>
  );
}
