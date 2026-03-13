"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { LogEntry, LogResponse } from "@/lib/types";

export function useLogPoller(interval = 2000) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const lastTimestampRef = useRef("");

  const poll = useCallback(async () => {
    try {
      const since = lastTimestampRef.current;
      const url = since ? `/logs?since=${encodeURIComponent(since)}` : "/logs";
      const res = await api<LogResponse>("GET", url);
      const newLogs = res.logs || [];
      if (newLogs.length > 0) {
        lastTimestampRef.current = newLogs[newLogs.length - 1].timestamp;
        setLogs((prev) => [...prev, ...newLogs]);
      }
    } catch {
      // silently ignore polling errors
    }
  }, []);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer);
  }, [poll, interval]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, clearLogs };
}
