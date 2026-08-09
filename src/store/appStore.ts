import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode } from "@/types/script";

export const DEFAULT_ACCENT = "#6366f1";
export const DEFAULT_FONT = "Courier Prime";

export interface EditorPrefs {
  scriptFont: string;
  fontSize: number;
  lineHeight: number;
  autoSaveSeconds: number;
  zenLineScale: number;
}

interface AppState {
  view: "landing" | "workspace" | "settings";
  theme: ThemeMode;
  accent: string;
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  focusMode: boolean;
  editor: EditorPrefs;

  setView: (view: AppState["view"]) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleAiPanel: () => void;
  setAiPanelOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (v: boolean) => void;
  patchEditor: (patch: Partial<EditorPrefs>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "landing",
      theme: "system",
      accent: DEFAULT_ACCENT,
      sidebarCollapsed: false,
      aiPanelOpen: false,
      focusMode: false,
      editor: {
        scriptFont: DEFAULT_FONT,
        fontSize: 16,
        lineHeight: 1.45,
        autoSaveSeconds: 5,
        zenLineScale: 1,
      },

      setView: (view) => set({ view }),
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setFocusMode: (focusMode) => set({ focusMode }),
      patchEditor: (patch) => set((s) => ({ editor: { ...s.editor, ...patch } })),
    }),
    {
      name: "agamiz-ui",
      partialize: (s) => ({
        theme: s.theme,
        accent: s.accent,
        editor: s.editor,
      }),
    },
  ),
);