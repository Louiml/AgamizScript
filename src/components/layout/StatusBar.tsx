import { useTranslation } from "react-i18next";
import { Sparkles, Save, CircleDot } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { useAiStore } from "@/store/aiStore";
import { computeStats } from "@/utils/counters";
import { SCRIPT_ELEMENT_LABEL } from "@/types/script";
import { cn } from "@/utils/cn";

export function StatusBar({ currentElement }: { currentElement?: string | null }) {
  const { t } = useTranslation();
  const nodes = useProjectStore((s) => s.nodes);
  const dirty = useProjectStore((s) => s.dirty);
  const activePkg = useProjectStore((s) => (s.activeId ? s.openTabs[s.activeId] : null));
  const provider = useAiStore((s) => s.provider);
  const busy = useAiStore((s) => s.busy);
  const accent = useAppStore((s) => s.accent);

  const stats = computeStats(
    nodes,
    activePkg?.metadata.type === "manuscript" ? "manuscript" : "screenplay",
  );

  const label = currentElement ? SCRIPT_ELEMENT_LABEL[currentElement as keyof typeof SCRIPT_ELEMENT_LABEL] : "";

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-surface/70 px-3 text-[11px] text-ink-muted backdrop-blur-md">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        {t("app.name")}
      </span>
      <span>{t("editor.wordCount", { count: stats.words })}</span>
      <span>{t("editor.pageCount", { count: stats.pages })}</span>
      {activePkg?.metadata.type === "screenplay" && label && (
        <>
          <span className="h-3 w-px bg-line" />
          <span>{label}</span>
        </>
      )}
      <span className="flex-1" />
      {busy && (
        <span className="inline-flex items-center gap-1 text-accent">
          <Sparkles size={11} className="animate-pulse" />
          {t("ai.title")}
        </span>
      )}
      <span
        className={cn("inline-flex items-center gap-1", dirty && "text-amber-500")}
      >
        {dirty ? <Save size={11} /> : <CircleDot size={11} />}
        {dirty ? t("status.unsavedChanges") : t("status.ready")}
      </span>
      <span className="uppercase">{provider}</span>
    </footer>
  );
}