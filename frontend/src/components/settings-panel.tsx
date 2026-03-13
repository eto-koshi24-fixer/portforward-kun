"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { FullConfigResponse } from "@/lib/types";

type SettingsTab = "global" | "envs" | "db";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "global", label: "グローバル設定" },
  { key: "envs", label: "環境" },
  { key: "db", label: "DB情報" },
];

interface SettingsPanelProps {
  config: FullConfigResponse | null;
  onBack: () => void;
  onEditGlobal: () => void;
  onAddEnv: () => void;
  onEditEnv: (envKey: string) => void;
  onDeleteEnv: (envKey: string) => void;
  onAddDb: () => void;
  onEditDb: (envKey: string, dbId: string) => void;
  onDeleteDb: (envKey: string, dbId: string) => void;
  onEditConn: (envKey: string, dbId: string) => void;
}

export function SettingsPanel({
  config,
  onBack,
  onEditGlobal,
  onAddEnv,
  onEditEnv,
  onDeleteEnv,
  onAddDb,
  onEditDb,
  onDeleteDb,
  onEditConn,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("global");
  const [dbEnvFilter, setDbEnvFilter] = useState("");

  if (!config) return null;

  const global = config.Global;
  const envKeys = Object.keys(config.Envs);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <Button variant="text" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          戻る
        </Button>
        <h1 className="text-2xl font-bold leading-[1.5] text-text-primary">
          設定
        </h1>
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors relative -mb-px cursor-pointer ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "global" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">
                グローバル設定
              </h3>
              <Button variant="text" size="xs" onClick={onEditGlobal}>
                編集
              </Button>
            </div>
            <div className="flex flex-col border border-border rounded-lg overflow-hidden">
              {(
                [
                  ["SSO Start URL", global.SsoStartUrl],
                  ["SSO Region", global.SsoRegion],
                  ["DB Port", global.DbPort],
                  ["DB User", global.DbUser],
                ] as const
              ).map(([key, val]) => (
                <div
                  key={String(key)}
                  className="flex py-2 px-4 border-b border-border last:border-b-0 hover:bg-bg-hover transition-colors"
                >
                  <span className="flex-[0_0_160px] text-sm font-semibold text-text-secondary">
                    {key}
                  </span>
                  <span className="text-sm text-text-primary break-all">
                    {String(val || "")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "envs" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">環境</h3>
              <Button variant="text" size="xs" onClick={onAddEnv}>
                追加
              </Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      キー
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      アクセスタイプ
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      Profile
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px] w-[120px] text-right">
                      操作
                    </TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {Object.entries(config.Envs).map(([key, env]) => (
                    <TableRow key={key} hoverable>
                      <TableCell className="!py-2 !px-3 !text-[13px]">
                        {key}
                      </TableCell>
                      <TableCell className="!py-2 !px-3 !text-[13px]">
                        {env.AccessType}
                      </TableCell>
                      <TableCell className="!py-2 !px-3 !text-[13px]">
                        {env.Profile || "-"}
                      </TableCell>
                      <TableCell className="!py-2 !px-3 !text-[13px] w-[120px] text-right whitespace-nowrap">
                        <Button
                          variant="text"
                          size="xs"
                          onClick={() => onEditEnv(key)}
                        >
                          編集
                        </Button>
                        <Button
                          variant="danger-text"
                          size="xs"
                          onClick={() => onDeleteEnv(key)}
                        >
                          削除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {activeTab === "db" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">
                DB情報
              </h3>
              <Button variant="text" size="xs" onClick={onAddDb}>
                追加
              </Button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Label className="!mb-0 whitespace-nowrap">環境</Label>
              <Select
                value={dbEnvFilter}
                onChange={(e) => setDbEnvFilter(e.target.value)}
                selectSize="sm"
              >
                <option value="">すべて</option>
                {envKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      環境
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      DB ID
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      表示名
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      カテゴリ
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      ホスト
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px]">
                      ポート
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-2 !px-3 !text-[13px] w-[160px] text-right">
                      操作
                    </TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {Object.entries(config.DbInstances).flatMap(
                    ([envKey, instances]) =>
                      !dbEnvFilter || envKey === dbEnvFilter
                        ? instances.map((inst) => {
                            const conn =
                              config.Connections?.[envKey]?.[inst.id];
                            const hostShort = conn?.host
                              ? conn.host.length > 25
                                ? `${conn.host.substring(0, 25)}…`
                                : conn.host
                              : "-";
                            return (
                              <TableRow
                                key={`${envKey}/${inst.id}`}
                                hoverable
                              >
                                <TableCell className="!py-2 !px-3 !text-[13px]">
                                  {envKey}
                                </TableCell>
                                <TableCell className="!py-2 !px-3 !text-[13px]">
                                  {inst.id}
                                </TableCell>
                                <TableCell className="!py-2 !px-3 !text-[13px]">
                                  {inst.display_name}
                                </TableCell>
                                <TableCell className="!py-2 !px-3 !text-[13px]">
                                  {inst.category === "common"
                                    ? "共通"
                                    : "テナント"}
                                </TableCell>
                                <TableCell
                                  className="!py-2 !px-3 !text-[13px] max-w-[200px] overflow-hidden text-ellipsis"
                                  title={conn?.host || ""}
                                >
                                  {hostShort}
                                </TableCell>
                                <TableCell className="!py-2 !px-3 !text-[13px]">
                                  {conn?.local_port || "-"}
                                </TableCell>
                                <TableCell className="!py-2 !px-3 !text-[13px] w-[160px] text-right whitespace-nowrap">
                                  <Button
                                    variant="text"
                                    size="xs"
                                    onClick={() => onEditDb(envKey, inst.id)}
                                  >
                                    編集
                                  </Button>
                                  <Button
                                    variant="text"
                                    size="xs"
                                    onClick={() =>
                                      onEditConn(envKey, inst.id)
                                    }
                                  >
                                    {conn ? "接続" : "接続追加"}
                                  </Button>
                                  <Button
                                    variant="danger-text"
                                    size="xs"
                                    onClick={() =>
                                      onDeleteDb(envKey, inst.id)
                                    }
                                  >
                                    削除
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : [],
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
