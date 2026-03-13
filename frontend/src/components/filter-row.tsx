"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { FullConfigResponse } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

interface FilterRowProps {
  config: FullConfigResponse | null;
}

export function FilterRow({ config }: FilterRowProps) {
  const filterEnv = useAppStore((s) => s.filterEnv);
  const filterCategory = useAppStore((s) => s.filterCategory);
  const filterConnectedOnly = useAppStore((s) => s.filterConnectedOnly);
  const setFilterEnv = useAppStore((s) => s.setFilterEnv);
  const setFilterCategory = useAppStore((s) => s.setFilterCategory);
  const setFilterConnectedOnly = useAppStore((s) => s.setFilterConnectedOnly);

  const envKeys = config ? Object.keys(config.Envs) : [];

  return (
    <div className="flex items-end gap-4 mb-4 flex-wrap">
      <div className="flex flex-col">
        <Label>環境</Label>
        <Select
          value={filterEnv}
          onChange={(e) => setFilterEnv(e.target.value)}
        >
          <option value="">すべて</option>
          {envKeys.map((env) => (
            <option key={env} value={env}>
              {env}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col">
        <Label>カテゴリ</Label>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">すべて</option>
          <option value="common">共通</option>
          <option value="tenant">テナント</option>
        </Select>
      </div>

      <div className="flex items-center pb-1.5">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="absolute opacity-0 w-0 h-0 peer"
            checked={filterConnectedOnly}
            onChange={(e) => setFilterConnectedOnly(e.target.checked)}
          />
          <span
            className="inline-flex items-center justify-center w-[18px] h-[18px] border-2 border-border-medium rounded-sm bg-white transition-[background-color,border-color] duration-150 ease-in-out peer-checked:bg-primary peer-checked:border-primary peer-checked:[&>.check-icon]:block peer-focus-visible:outline-4 peer-focus-visible:outline-black peer-focus-visible:outline-offset-2 peer-focus-visible:shadow-[0_0_0_2px_#FFD43D] hover:border-border-hover shrink-0"
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
          <span className="text-sm text-text-primary">接続中のみ</span>
        </label>
      </div>
    </div>
  );
}
