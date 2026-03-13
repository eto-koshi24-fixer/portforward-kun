"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useLogPoller } from "@/hooks/use-log-poller";

export function LogPanel() {
  const { logs, clearLogs } = useLogPoller();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, []);

  const levelClass = (level: string) => {
    switch (level) {
      case "error":
        return "text-error";
      case "warn":
        return "text-warning";
      default:
        return "text-text-primary";
    }
  };

  return (
    <div className="mt-4 border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">ログ</span>
        <Button variant="text" size="xs" onClick={clearLogs}>
          クリア
        </Button>
      </div>
      <div
        ref={contentRef}
        className="h-[180px] p-3 overflow-y-auto font-mono text-[13px] leading-[1.6] bg-white whitespace-pre-wrap break-all"
      >
        {logs.map((entry, i) => {
          const time = entry.timestamp.split("T")[1]?.substring(0, 8) || "";
          const levelTag = entry.level.toUpperCase().padEnd(5);
          return (
            <span
              key={`${entry.timestamp}-${i}`}
              className={levelClass(entry.level)}
            >
              {`[${time}] [${levelTag}] ${entry.message}\n`}
            </span>
          );
        })}
      </div>
    </div>
  );
}
