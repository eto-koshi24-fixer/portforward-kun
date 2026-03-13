import useSWR from "swr";
import { api } from "@/lib/api";
import type {
  ConnectResponse,
  DisconnectAllResponse,
  DisconnectResponse,
  TestConnectionResponse,
  TunnelListResponse,
} from "@/lib/types";

const fetcher = () => api<TunnelListResponse>("GET", "/tunnels");

export function useTunnels() {
  const { data, error, isLoading, mutate } = useSWR("/api/tunnels", fetcher, {
    refreshInterval: 3000,
  });

  const connect = async (
    env: string,
    dbId: string,
    localPort?: number | null,
  ) => {
    const body = localPort ? { local_port: localPort } : {};
    const res = await api<ConnectResponse>(
      "POST",
      `/tunnels/${env}/${dbId}/connect`,
      body,
    );
    await mutate();
    return res;
  };

  const disconnect = async (env: string, dbId: string) => {
    const res = await api<DisconnectResponse>(
      "POST",
      `/tunnels/${env}/${dbId}/disconnect`,
    );
    await mutate();
    return res;
  };

  const disconnectAll = async () => {
    const res = await api<DisconnectAllResponse>(
      "POST",
      "/tunnels/disconnect-all",
    );
    await mutate();
    return res;
  };

  const testConnection = async (env: string, dbId: string) => {
    return api<TestConnectionResponse>("POST", "/test-connection", {
      env,
      db_id: dbId,
    });
  };

  return {
    tunnels: data?.tunnels ?? [],
    error,
    isLoading,
    mutate,
    connect,
    disconnect,
    disconnectAll,
    testConnection,
  };
}
