import { useTranslation } from "react-i18next";
import { X, Captions, Type, BookOpen } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { Sidebar, type Pane } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { ScreenplayEditor } from "@/components/editor/ScreenplayEditor";
import { SrtEditor } from "@/components/subtitles/SrtEditor";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { BiblePanel } from "@/components/bible/BiblePanel";
import { BeatBoard } from "@/components/cards/BeatBoard";
import { useContextMenu, type CtxItem } from "@/components/ui/ContextMenu";
import { FileText } from "lucide-react";
import { cn } from "@/utils/cn";
import { useState } from "react";

export function Workspace() {
  const { t } = useTranslation();
  const openTabs = useProjectStore((s) => s.openTabs);
  const activeId = useProjectStore((s) => s.activeId);
  const setActive = useProjectStore((s) => s.setActive);
  const closeTab = useProjectStore((s) => s.closeTab);
  const setView = useAppStore((s) => s.setView);
  const aiPanelOpen = useAppStore((s) => s.aiPanelOpen);
  const focusMode = useAppStore((s) => s.focusMode);
  const [pane, setPane] = useState<Pane>("editor");
  const { ctxMenu, openContextMenu } = useContextMenu();

  const activePkg = activeId ? openTabs[activeId] : null;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  };

  const tabMenu = (id: string): CtxItem[] => {
    const pkg = openTabs[id];
    if (!pkg) return [];
    return [
      { label: t("app.copyTitle"), icon: <FileText size={13} />, onSelect: () => void copyText(pkg.metadata.title) },
      { label: t("app.closeTab"), icon: <X size={13} />, onSelect: () => closeTab(id) },
      {
        label: t("app.closeOtherTabs"),
        icon: <X size={13} />,
        onSelect: () => {
          Object.keys(openTabs).forEach((k) => { if (k !== id) closeTab(k); });
        },
      },
      { label: "", onSelect: () => undefined },
      { label: t("app.closeAll"), icon: <X size={13} />, danger: true, onSelect: () => Object.keys(openTabs).forEach(closeTab) },
    ];
  };

  if (focusMode && activePkg?.metadata.type !== "subtitle") {
    return (
      <div className="flex h-full flex-col bg-surface">
        <div className="min-h-0 flex-1">
          <ScreenplayEditor key={activeId} />
        </div>
        <StatusBar />
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-surface">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-line bg-surface-raised/70 px-2 py-1.5 backdrop-blur-md">
        <button
          onClick={() => setView("landing")}
          className="mr-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          <Type size={13} /> {t("app.name")}
        </button>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {Object.entries(openTabs).map(([id, pkg]) => {
            const active = id === activeId;
            const Icon = pkg.metadata.type === "subtitle" ? Captions : pkg.metadata.type === "manuscript" ? BookOpen : Type;
            return (
              <div
                key={id}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-accent/40 bg-accent/10 text-ink"
                    : "border-line text-ink-muted hover:border-accent/20",
                )}
              >
                <Icon size={12} />
                <button
                  className="max-w-40 truncate"
                  onClick={() => setActive(id)}
                  onContextMenu={(e) => openContextMenu(e, tabMenu(id))}
                >
                  {pkg.metadata.title || t("project.untitled")}
                </button>
                <button
                  className="rounded p-0.5 hover:bg-surface-muted"
                  onClick={() => closeTab(id)}
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1 text-[11px] text-ink-muted">
          {activePkg && (
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 uppercase">
              {activePkg.metadata.type}
            </span>
          )}
        </div>
      </div>

      {/* Main split */}
      <div className="flex min-h-0 flex-1">
        <Sidebar activePane={pane} onSelectPane={setPane} />

        <main className="min-w-0 flex-1">
          {activePkg?.metadata.type === "subtitle" ? (
            <SrtEditor key={activeId} />
          ) : pane === "bible" ? (
            <BiblePanel />
          ) : pane === "cards" ? (
            <BeatBoard />
          ) : (
            <ScreenplayEditor key={activeId} />
          )}
        </main>

        {aiPanelOpen && <AiAssistantPanel getContext={clipboardContext} />}
      </div>

      <StatusBar />
      {ctxMenu}
    </div>
  );
}

function clipboardContext(): string {
  const s = useProjectStore.getState();
  return s.nodes
    .filter((n) => n.text.trim())
    .slice(-60)
    .map((n) => n.text)
    .join("\n");
}