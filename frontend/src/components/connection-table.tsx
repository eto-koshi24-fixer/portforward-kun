"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { TunnelStatus } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

interface ConnectionTableProps {
  tunnels: TunnelStatus[];
  onPortEdit: (env: string, dbId: string, currentPort: number) => void;
}

export function ConnectionTable({ tunnels, onPortEdit }: ConnectionTableProps) {
  const selectedRows = useAppStore((s) => s.selectedRows);
  const toggleRow = useAppStore((s) => s.toggleRow);
  const selectAll = useAppStore((s) => s.selectAll);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const filterEnv = useAppStore((s) => s.filterEnv);
  const filterCategory = useAppStore((s) => s.filterCategory);
  const filterConnectedOnly = useAppStore((s) => s.filterConnectedOnly);

  const filteredTunnels = tunnels.filter((t) => {
    if (filterEnv && t.env !== filterEnv) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterConnectedOnly && !t.connected) return false;
    return true;
  });

  const allSelected =
    filteredTunnels.length > 0 &&
    filteredTunnels.every((t) => selectedRows.has(`${t.env}/${t.db_id}`));

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(filteredTunnels.map((t) => `${t.env}/${t.db_id}`));
    }
  };

  return (
    <div className="flex-1 min-h-[200px] overflow-hidden border border-border rounded-lg flex flex-col">
      <Table className="flex-1 overflow-y-auto">
        <TableHeader>
          <tr>
            <TableHeaderCell className="w-12 pl-3 pr-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="absolute opacity-0 w-0 h-0 peer"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="すべて選択"
                />
                <span
                  className="inline-flex items-center justify-center w-[18px] h-[18px] border-2 border-border-medium rounded-sm bg-white transition-[background-color,border-color] duration-150 peer-checked:bg-primary peer-checked:border-primary peer-checked:[&>.check-icon]:block peer-focus-visible:outline-4 peer-focus-visible:outline-black peer-focus-visible:outline-offset-2 peer-focus-visible:shadow-[0_0_0_2px_#FFD43D] hover:border-border-hover shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="check-icon hidden text-white"
                    width="12"
                    height="10"
                    viewBox="0 0 12 10"
                    fill="none"
                  >
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </label>
            </TableHeaderCell>
            <TableHeaderCell>環境</TableHeaderCell>
            <TableHeaderCell>DB名</TableHeaderCell>
            <TableHeaderCell>カテゴリ</TableHeaderCell>
            <TableHeaderCell>ホスト</TableHeaderCell>
            <TableHeaderCell className="w-20">ポート</TableHeaderCell>
            <TableHeaderCell>状態</TableHeaderCell>
          </tr>
        </TableHeader>
        <TableBody>
          {filteredTunnels.map((t) => {
            const key = `${t.env}/${t.db_id}`;
            const isSelected = selectedRows.has(key);
            const hostShort =
              t.host.length > 35 ? `${t.host.substring(0, 35)}…` : t.host;
            const catLabel = t.category === "common" ? "共通" : "テナント";

            return (
              <TableRow key={key} selected={isSelected} hoverable>
                <TableCell className="w-12 pl-3 pr-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="absolute opacity-0 w-0 h-0 peer"
                      checked={isSelected}
                      onChange={() => toggleRow(key)}
                      aria-label={`${t.env}/${t.display_name} を選択`}
                    />
                    <span
                      className="inline-flex items-center justify-center w-[18px] h-[18px] border-2 border-border-medium rounded-sm bg-white transition-[background-color,border-color] duration-150 peer-checked:bg-primary peer-checked:border-primary peer-checked:[&>.check-icon]:block peer-focus-visible:outline-4 peer-focus-visible:outline-black peer-focus-visible:outline-offset-2 peer-focus-visible:shadow-[0_0_0_2px_#FFD43D] hover:border-border-hover shrink-0"
                      aria-hidden="true"
                    >
                      <svg
                        className="check-icon hidden text-white"
                        width="12"
                        height="10"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </label>
                </TableCell>
                <TableCell>{t.env}</TableCell>
                <TableCell>{t.display_name}</TableCell>
                <TableCell>{catLabel}</TableCell>
                <TableCell
                  className="max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={t.host}
                >
                  {hostShort}
                </TableCell>
                <TableCell className="w-20">
                  {t.local_port ? (
                    <Button
                      variant="text"
                      size="xs"
                      onClick={() => onPortEdit(t.env, t.db_id, t.local_port!)}
                      aria-label="ポート番号を編集"
                    >
                      {t.local_port}
                    </Button>
                  ) : (
                    <span className="text-text-disabled">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip color={t.connected ? "green" : "gray"}>
                    {t.connected ? "接続中" : "未接続"}
                  </Chip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
