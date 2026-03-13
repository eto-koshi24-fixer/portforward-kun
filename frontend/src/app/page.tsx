"use client";

import { useCallback, useState } from "react";
import { ActionRow } from "@/components/action-row";
import { AppHeader } from "@/components/app-header";
import { ConnectionTable } from "@/components/connection-table";
import { ConnDeleteDialog } from "@/components/dialogs/conn-delete-dialog";
import { ConnEditDialog } from "@/components/dialogs/conn-edit-dialog";
import { ConnTestDialog } from "@/components/dialogs/conn-test-dialog";
import { ConnectConfirmDialog } from "@/components/dialogs/connect-confirm-dialog";
import { DbDeleteDialog } from "@/components/dialogs/db-delete-dialog";
import { DbEditDialog } from "@/components/dialogs/db-edit-dialog";
import { DisconnectAllDialog } from "@/components/dialogs/disconnect-all-dialog";
import { DisconnectConfirmDialog } from "@/components/dialogs/disconnect-confirm-dialog";
import { EnvDeleteDialog } from "@/components/dialogs/env-delete-dialog";
import { EnvEditDialog } from "@/components/dialogs/env-edit-dialog";
import { GlobalEditDialog } from "@/components/dialogs/global-edit-dialog";
import { MultiSsmDialog } from "@/components/dialogs/multi-ssm-dialog";
import { PortEditDialog } from "@/components/dialogs/port-edit-dialog";
import { FilterRow } from "@/components/filter-row";
import { LogPanel } from "@/components/log-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { Snackbar } from "@/components/ui/snackbar";
import { LoadingOverlay } from "@/components/ui/spinner";
import { useConfig } from "@/hooks/use-config";
import { useDialog } from "@/hooks/use-dialog";
import { useTunnels } from "@/hooks/use-tunnels";
import type { TestStep } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";

type PageView = "main" | "settings";

export default function Home() {
  const {
    config,
    mutate: mutateConfig,
    saveGlobal,
    saveEnv,
    deleteEnv,
    saveDbInstance,
    deleteDbInstance,
    saveConnection,
    deleteConnection,
  } = useConfig();
  const { tunnels, connect, disconnect, disconnectAll, testConnection } =
    useTunnels();

  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const loading = useAppStore((s) => s.loading);
  const setLoading = useAppStore((s) => s.setLoading);
  const editingTarget = useAppStore((s) => s.editingTarget);
  const setEditingTarget = useAppStore((s) => s.setEditingTarget);
  const selectedRows = useAppStore((s) => s.selectedRows);
  const clearSelection = useAppStore((s) => s.clearSelection);

  // Page view state
  const [view, setView] = useState<PageView>("main");

  // Port edit state
  const [portEditPort, setPortEditPort] = useState(0);

  // Env edit state
  const [editingEnvKey, setEditingEnvKey] = useState("");

  // DB edit state
  const [editingDbEnv, setEditingDbEnv] = useState("");
  const [editingDbId, setEditingDbId] = useState("");

  // Conn edit state
  const [editingConnEnv, setEditingConnEnv] = useState("");
  const [editingConnDbId, setEditingConnDbId] = useState("");
  const [connTestPassed, setConnTestPassed] = useState(false);

  // Connection test state
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [testing, setTesting] = useState(false);

  // Dialog refs
  const connectDialog = useDialog();
  const disconnectDialog = useDialog();
  const disconnectAllDialog = useDialog();
  const multiSsmDialog = useDialog();
  const portEditDialog = useDialog();
  const globalEditDialog = useDialog();
  const envEditDialog = useDialog();
  const envDeleteDialog = useDialog();
  const dbEditDialog = useDialog();
  const dbDeleteDialog = useDialog();
  const connEditDialog = useDialog();
  const connDeleteDialog = useDialog();
  const connTestDialog = useDialog();

  // Selected tunnel helpers
  const getSelectedTunnels = useCallback(() => {
    return tunnels.filter((t) => selectedRows.has(`${t.env}/${t.db_id}`));
  }, [tunnels, selectedRows]);

  // Connect flow
  const handleConnectClick = () => {
    const selected = getSelectedTunnels();
    const disconnected = selected.filter((t) => !t.connected);
    if (disconnected.length === 0) return;
    const t = disconnected[0];
    setEditingTarget({ env: t.env, db_id: t.db_id });
    connectDialog.open();
  };

  const handleConnectConfirm = async () => {
    setLoading(true);
    try {
      const res = await connect(editingTarget.env, editingTarget.db_id);
      showSnackbar(res.message, "success", 5000);
      clearSelection();
    } catch (e) {
      showSnackbar(`接続エラー: ${(e as Error).message}`, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect flow
  const handleDisconnectClick = () => {
    const selected = getSelectedTunnels();
    const connected = selected.filter((t) => t.connected);
    if (connected.length === 0) return;
    const t = connected[0];
    setEditingTarget({ env: t.env, db_id: t.db_id });
    disconnectDialog.open();
  };

  const handleDisconnectConfirm = async () => {
    setLoading(true);
    try {
      const res = await disconnect(editingTarget.env, editingTarget.db_id);
      showSnackbar(res.message, "default", 3000);
      clearSelection();
    } catch (e) {
      showSnackbar(`切断エラー: ${(e as Error).message}`, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect all
  const handleDisconnectAllClick = () => {
    disconnectAllDialog.open();
  };

  const handleDisconnectAllConfirm = async () => {
    setLoading(true);
    try {
      const res = await disconnectAll();
      showSnackbar(res.message, "default", 3000);
      clearSelection();
    } catch (e) {
      showSnackbar(`全切断エラー: ${(e as Error).message}`, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Multi SSM
  const handleMultiSsmClick = () => {
    multiSsmDialog.open();
  };

  const handleMultiSsmConfirm = async (
    startPort: number,
    sessionCount: number,
  ) => {
    const selected = getSelectedTunnels();
    if (selected.length !== 1) return;
    const t = selected[0];
    setLoading(true);
    try {
      for (let i = 0; i < sessionCount; i++) {
        await connect(t.env, t.db_id, startPort + i);
      }
      showSnackbar(
        `マルチSSM接続を開始しました (${sessionCount}セッション)`,
        "success",
        5000,
      );
      clearSelection();
    } catch (e) {
      showSnackbar(
        `マルチSSM接続エラー: ${(e as Error).message}`,
        "error",
        5000,
      );
    } finally {
      setLoading(false);
    }
  };

  // Port edit
  const handlePortEdit = (env: string, dbId: string, currentPort: number) => {
    setEditingTarget({ env, db_id: dbId });
    setPortEditPort(currentPort);
    portEditDialog.open();
  };

  const handlePortEditConfirm = async (port: number) => {
    const { env, db_id } = editingTarget;
    const conn = config?.Connections?.[env]?.[db_id];
    if (!conn) return;
    setLoading(true);
    try {
      await saveConnection(env, db_id, {
        host: conn.host,
        password: conn.password,
        local_port: port,
      });
      showSnackbar("ポートを変更しました", "success", 3000);
    } catch (e) {
      showSnackbar(`ポート変更エラー: ${(e as Error).message}`, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Global edit
  const handleEditGlobal = () => {
    globalEditDialog.open();
  };

  const handleSaveGlobal = async (data: Parameters<typeof saveGlobal>[0]) => {
    try {
      await saveGlobal(data);
      showSnackbar("グローバル設定を保存しました", "success", 3000);
    } catch (e) {
      showSnackbar(`保存エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  // Env CRUD
  const handleAddEnv = () => {
    setEditingEnvKey("");
    envEditDialog.open();
  };

  const handleEditEnv = (envKey: string) => {
    setEditingEnvKey(envKey);
    envEditDialog.open();
  };

  const handleDeleteEnvClick = (envKey: string) => {
    setEditingTarget({ env: envKey, db_id: "" });
    envDeleteDialog.open();
  };

  const handleSaveEnv = async (
    key: string,
    data: Parameters<typeof saveEnv>[1],
  ) => {
    try {
      await saveEnv(key, data);
      showSnackbar("環境を保存しました", "success", 3000);
    } catch (e) {
      showSnackbar(`保存エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  const handleDeleteEnvConfirm = async () => {
    try {
      await deleteEnv(editingTarget.env);
      showSnackbar("環境を削除しました", "default", 3000);
    } catch (e) {
      showSnackbar(`削除エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  // DB CRUD
  const handleAddDb = () => {
    setEditingDbEnv("");
    setEditingDbId("");
    dbEditDialog.open();
  };

  const handleEditDb = (envKey: string, dbId: string) => {
    setEditingDbEnv(envKey);
    setEditingDbId(dbId);
    dbEditDialog.open();
  };

  const handleDeleteDbClick = (envKey: string, dbId: string) => {
    setEditingTarget({ env: envKey, db_id: dbId });
    dbDeleteDialog.open();
  };

  const handleSaveDb = async (
    envKey: string,
    data: Parameters<typeof saveDbInstance>[1],
  ) => {
    try {
      await saveDbInstance(envKey, data);
      showSnackbar("DBインスタンスを保存しました", "success", 3000);
    } catch (e) {
      showSnackbar(`保存エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  const handleDeleteDbConfirm = async () => {
    try {
      await deleteDbInstance(editingTarget.env, editingTarget.db_id);
      showSnackbar("DBインスタンスを削除しました", "default", 3000);
    } catch (e) {
      showSnackbar(`削除エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  // Connection CRUD
  const handleAddConn = () => {
    setEditingConnEnv("");
    setEditingConnDbId("");
    setConnTestPassed(false);
    connEditDialog.open();
  };

  const handleEditConn = (envKey: string, dbId: string) => {
    setEditingConnEnv(envKey);
    setEditingConnDbId(dbId);
    setConnTestPassed(true);
    connEditDialog.open();
  };

  const handleDeleteConnClick = (envKey: string, dbId: string) => {
    setEditingTarget({ env: envKey, db_id: dbId });
    connDeleteDialog.open();
  };

  const handleSaveConn = async (
    envKey: string,
    dbId: string,
    data: Parameters<typeof saveConnection>[2],
  ) => {
    try {
      await saveConnection(envKey, dbId, data);
      await mutateConfig();
      showSnackbar("接続情報を保存しました", "success", 3000);
    } catch (e) {
      showSnackbar(`保存エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  const handleDeleteConnConfirm = async () => {
    try {
      await deleteConnection(editingTarget.env, editingTarget.db_id);
      showSnackbar("接続情報を削除しました", "default", 3000);
    } catch (e) {
      showSnackbar(`削除エラー: ${(e as Error).message}`, "error", 5000);
    }
  };

  // Connection test
  const handleTestConnection = async (env: string, dbId: string) => {
    setEditingTarget({ env, db_id: dbId });
    setTestSteps([]);
    setTesting(true);
    connTestDialog.open();

    try {
      const res = await testConnection(env, dbId);
      setTestSteps(res.steps);
      if (res.success) {
        setConnTestPassed(true);
        showSnackbar("接続テスト成功", "success", 3000);
      }
    } catch (e) {
      showSnackbar(`接続テストエラー: ${(e as Error).message}`, "error", 5000);
    } finally {
      setTesting(false);
    }
  };

  const handleRetest = () => {
    handleTestConnection(editingTarget.env, editingTarget.db_id);
  };

  // Computed
  const connectedCount = tunnels.filter((t) => t.connected).length;
  const connectTargetName = (() => {
    const t = tunnels.find(
      (t) => t.env === editingTarget.env && t.db_id === editingTarget.db_id,
    );
    return t ? `${t.env} / ${t.display_name}` : "";
  })();

  return (
    <div className="max-w-[1200px] mx-auto p-6 flex flex-col min-h-screen">
      {view === "main" ? (
        <>
          <AppHeader onSettingsClick={() => setView("settings")} />
          <FilterRow config={config} />
          <ActionRow
            tunnels={tunnels}
            onConnect={handleConnectClick}
            onDisconnect={handleDisconnectClick}
            onDisconnectAll={handleDisconnectAllClick}
            onMultiSsm={handleMultiSsmClick}
          />
          <ConnectionTable tunnels={tunnels} onPortEdit={handlePortEdit} />
          <LogPanel />
        </>
      ) : (
        <SettingsPanel
          config={config}
          onBack={() => setView("main")}
          onEditGlobal={handleEditGlobal}
          onAddEnv={handleAddEnv}
          onEditEnv={handleEditEnv}
          onDeleteEnv={handleDeleteEnvClick}
          onAddDb={handleAddDb}
          onEditDb={handleEditDb}
          onDeleteDb={handleDeleteDbClick}
          onEditConn={handleEditConn}
        />
      )}

      {/* Dialogs */}
      <ConnectConfirmDialog
        ref={connectDialog.ref}
        targetName={connectTargetName}
        onConfirm={handleConnectConfirm}
      />
      <DisconnectConfirmDialog
        ref={disconnectDialog.ref}
        targetName={connectTargetName}
        onConfirm={handleDisconnectConfirm}
      />
      <DisconnectAllDialog
        ref={disconnectAllDialog.ref}
        connectedCount={connectedCount}
        onConfirm={handleDisconnectAllConfirm}
      />
      <MultiSsmDialog
        ref={multiSsmDialog.ref}
        onConfirm={handleMultiSsmConfirm}
      />
      <PortEditDialog
        ref={portEditDialog.ref}
        currentPort={portEditPort}
        onConfirm={handlePortEditConfirm}
      />
      <GlobalEditDialog
        ref={globalEditDialog.ref}
        globalConfig={config?.Global ?? null}
        onSave={handleSaveGlobal}
      />
      <EnvEditDialog
        ref={envEditDialog.ref}
        editingKey={editingEnvKey}
        envConfig={config?.Envs?.[editingEnvKey] ?? null}
        onSave={handleSaveEnv}
      />
      <EnvDeleteDialog
        ref={envDeleteDialog.ref}
        envKey={editingTarget.env}
        onConfirm={handleDeleteEnvConfirm}
      />
      <DbEditDialog
        ref={dbEditDialog.ref}
        config={config}
        editingEnv={editingDbEnv}
        editingDbId={editingDbId}
        onSave={handleSaveDb}
      />
      <DbDeleteDialog
        ref={dbDeleteDialog.ref}
        dbName={editingTarget.db_id}
        onConfirm={handleDeleteDbConfirm}
      />
      <ConnEditDialog
        ref={connEditDialog.ref}
        config={config}
        editingEnv={editingConnEnv}
        editingDbId={editingConnDbId}
        onSave={handleSaveConn}
        onTestConnection={handleTestConnection}
        testPassed={connTestPassed}
      />
      <ConnDeleteDialog
        ref={connDeleteDialog.ref}
        connName={`${editingTarget.env} / ${editingTarget.db_id}`}
        onConfirm={handleDeleteConnConfirm}
      />
      <ConnTestDialog
        ref={connTestDialog.ref}
        steps={testSteps}
        testing={testing}
        onRetest={handleRetest}
      />

      {/* Global overlays */}
      <LoadingOverlay visible={loading} />
      <Snackbar />
    </div>
  );
}
