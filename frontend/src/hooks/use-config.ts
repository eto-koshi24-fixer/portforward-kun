import useSWR from "swr";
import { api } from "@/lib/api";
import type {
  ConnectionConfig,
  DbInstance,
  EnvConfig,
  FullConfigResponse,
  GlobalConfig,
} from "@/lib/types";

const fetcher = () => api<FullConfigResponse>("GET", "/config");

export function useConfig() {
  const { data, error, isLoading, mutate } = useSWR("/api/config", fetcher);

  // Mutation helpers
  const saveGlobal = async (body: Partial<GlobalConfig>) => {
    await api("PUT", "/config/global", body);
    await mutate();
  };

  const saveEnv = async (key: string, body: Partial<EnvConfig>) => {
    await api("POST", `/config/envs/${key}`, body);
    await mutate();
  };

  const deleteEnv = async (key: string) => {
    await api("DELETE", `/config/envs/${key}`);
    await mutate();
  };

  const saveDbInstance = async (envKey: string, body: DbInstance) => {
    await api("POST", `/config/db-instances/${envKey}`, body);
    await mutate();
  };

  const deleteDbInstance = async (envKey: string, dbId: string) => {
    await api("DELETE", `/config/db-instances/${envKey}/${dbId}`);
    await mutate();
  };

  const saveConnection = async (
    envKey: string,
    dbId: string,
    body: Partial<ConnectionConfig>,
  ) => {
    await api("POST", `/config/connections/${envKey}/${dbId}`, body);
    await mutate();
  };

  const deleteConnection = async (envKey: string, dbId: string) => {
    await api("DELETE", `/config/connections/${envKey}/${dbId}`);
    await mutate();
  };

  return {
    config: data ?? null,
    error,
    isLoading,
    mutate,
    saveGlobal,
    saveEnv,
    deleteEnv,
    saveDbInstance,
    deleteDbInstance,
    saveConnection,
    deleteConnection,
  };
}
