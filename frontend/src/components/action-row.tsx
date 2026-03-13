"use client";

import { Button } from "@/components/ui/button";
import type { TunnelStatus } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

interface ActionRowProps {
  tunnels: TunnelStatus[];
  onConnect: () => void;
  onDisconnect: () => void;
  onDisconnectAll: () => void;
  onMultiSsm: () => void;
}

export function ActionRow({
  tunnels,
  onConnect,
  onDisconnect,
  onDisconnectAll,
  onMultiSsm,
}: ActionRowProps) {
  const selectedRows = useAppStore((s) => s.selectedRows);

  const selectedTunnels = tunnels.filter((t) =>
    selectedRows.has(`${t.env}/${t.db_id}`),
  );
  const hasSelection = selectedTunnels.length > 0;
  const hasDisconnected = selectedTunnels.some((t) => !t.connected);
  const hasConnected = selectedTunnels.some((t) => t.connected);
  const isSingleSelection = selectedTunnels.length === 1;
  const anyConnected = tunnels.some((t) => t.connected);

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="solid-fill"
        size="sm"
        aria-disabled={!hasSelection || !hasDisconnected}
        onClick={onConnect}
      >
        接続
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-disabled={!hasSelection || !isSingleSelection}
        onClick={onMultiSsm}
      >
        マルチSSM接続
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-disabled={!hasSelection || !hasConnected}
        onClick={onDisconnect}
      >
        切断
      </Button>
      <Button
        variant="delete"
        size="sm"
        aria-disabled={!anyConnected}
        onClick={onDisconnectAll}
      >
        全切断
      </Button>
    </div>
  );
}
