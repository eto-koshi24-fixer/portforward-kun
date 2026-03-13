import { create } from "zustand";

interface SnackbarState {
  message: string;
  type: "default" | "success" | "error";
}

interface EditingTarget {
  env: string;
  db_id: string;
}

interface AppState {
  // Editing target
  editingTarget: EditingTarget;
  setEditingTarget: (target: EditingTarget) => void;

  // Selected rows (Set of "env/db_id" keys)
  selectedRows: Set<string>;
  toggleRow: (key: string) => void;
  selectAll: (keys: string[]) => void;
  clearSelection: () => void;

  // Filters
  filterEnv: string;
  filterCategory: string;
  filterConnectedOnly: boolean;
  setFilterEnv: (v: string) => void;
  setFilterCategory: (v: string) => void;
  setFilterConnectedOnly: (v: boolean) => void;

  // Snackbar
  snackbar: SnackbarState | null;
  showSnackbar: (
    message: string,
    type?: "default" | "success" | "error",
    duration?: number,
  ) => void;
  hideSnackbar: () => void;

  // Loading
  loading: boolean;
  setLoading: (v: boolean) => void;
}

let snackbarTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>((set) => ({
  editingTarget: { env: "", db_id: "" },
  setEditingTarget: (target) => set({ editingTarget: target }),

  selectedRows: new Set<string>(),
  toggleRow: (key) =>
    set((state) => {
      const next = new Set(state.selectedRows);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { selectedRows: next };
    }),
  selectAll: (keys) => set({ selectedRows: new Set(keys) }),
  clearSelection: () => set({ selectedRows: new Set() }),

  filterEnv: "",
  filterCategory: "",
  filterConnectedOnly: false,
  setFilterEnv: (v) => set({ filterEnv: v }),
  setFilterCategory: (v) => set({ filterCategory: v }),
  setFilterConnectedOnly: (v) => set({ filterConnectedOnly: v }),

  snackbar: null,
  showSnackbar: (message, type = "default", duration = 3000) => {
    if (snackbarTimer) clearTimeout(snackbarTimer);
    set({ snackbar: { message, type } });
    if (duration > 0) {
      snackbarTimer = setTimeout(() => {
        set({ snackbar: null });
      }, duration);
    }
  },
  hideSnackbar: () => {
    if (snackbarTimer) clearTimeout(snackbarTimer);
    set({ snackbar: null });
  },

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
