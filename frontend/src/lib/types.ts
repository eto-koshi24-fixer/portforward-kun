// TypeScript types mirroring backend/models.py

export interface GlobalConfig {
  SsoStartUrl: string;
  SsoRegion: string;
  DefaultRegion: string;
  Output: string;
  DbPort: number;
  DbUser: string;
  CacheLookbackHours: number;
  BastionTagKeys?: Record<string, string> | null;
}

export interface EnvConfig {
  AccessType: string;
  Profile?: string | null;
  AccountId?: string | null;
  RoleName?: string | null;
  EnvTagValue?: string | null;
}

export interface DbInstance {
  id: string;
  display_name: string;
  category: string;
}

export interface ConnectionConfig {
  host: string;
  password: string;
  local_port?: number | null;
}

export interface TunnelStatus {
  env: string;
  db_id: string;
  display_name: string;
  category: string;
  host: string;
  local_port?: number | null;
  connected: boolean;
  pid?: number | null;
}

export interface TunnelListResponse {
  tunnels: TunnelStatus[];
}

export interface TestStep {
  step: number;
  name: string;
  status: "success" | "error" | "skipped";
  message: string;
}

export interface TestConnectionResponse {
  success: boolean;
  steps: TestStep[];
}

export interface ConnectResponse {
  env: string;
  db_id: string;
  local_port: number;
  pid?: number | null;
  message: string;
}

export interface DisconnectResponse {
  env: string;
  db_id: string;
  message: string;
}

export interface DisconnectAllResponse {
  disconnected: number;
  message: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface LogResponse {
  logs: LogEntry[];
}

export interface FullConfigResponse {
  Global: GlobalConfig;
  Envs: Record<string, EnvConfig>;
  DbInstances: Record<string, DbInstance[]>;
  Connections: Record<string, Record<string, ConnectionConfig>>;
}

export interface ErrorResponse {
  detail: string;
}
