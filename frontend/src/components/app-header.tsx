"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export function AppHeader({ onSettingsClick }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-4 pb-4 border-b border-border">
      <h1 className="text-2xl font-bold leading-[1.5] text-text-primary">
        ポートフォワード管理くん
      </h1>
      <Button variant="outline" size="sm" onClick={onSettingsClick}>
        <Settings size={16} />
        設定
      </Button>
    </header>
  );
}
