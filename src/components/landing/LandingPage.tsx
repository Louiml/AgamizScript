import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FolderOpen,
  FileUp,
  Settings,
  FileText,
  X,
  Search,
  Clapperboard,
  Theater,
  Tv,
  Youtube,
  BookOpen,
  Captions,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { TEMPLATES, buildTemplateProject } from "@/lib/templates";
import { openProjectFile, openProjectPath } from "@/lib/io";
import { useContextMenu, type CtxItem } from "@/components/ui/ContextMenu";
import { ClipboardCopy, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ProjectDescriptor, ProjectType } from "@/types/script";

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  clapperboard: Clapperboard,
  theater: Theater,
  tv: Tv,
  youtube: Youtube,
  book: BookOpen,
  captions: Captions,
};

const TYPE_LABELS: Record<ProjectType, string> = {
  screenplay: "Screenplay",
  manuscript: "Manuscript",
  subtitle: "Subtitles",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function LandingPage() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const recent = useProjectStore((s) => s.recent);
  const openProject = useProjectStore((s) => s.openProject);
  const addRecent = useProjectStore((s) => s.addRecent);
  const removeRecent = useProjectStore((s) => s.removeRecent);
  const { ctxMenu, openContextMenu } = useContextMenu();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("");

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  };

  const recentMenu = (project: ProjectDescriptor): CtxItem[] => {
    const items: CtxItem[] = [
      { label: t("app.open"), icon: <FolderOpen size={13} />, onSelect: () => void openRecentProject(project) },
      { label: t("app.copyTitle"), icon: <FileText size={13} />, onSelect: () => void copyText(project.title) },
    ];
    if (project.filePath) {
      items.push({
        label: t("app.copyPath"),
        icon: <ExternalLink size={13} />,
        onSelect: () => void copyText(project.filePath ?? ""),
      });
    }
    items.push(
      { label: "", onSelect: () => undefined },
      {
        label: t("app.removeFromList"),
        icon: <Trash2 size={13} />,
        danger: true,
        onSelect: () => removeRecent(project.id),
      },
    );
    return items;
  };

  const templateMenu = (template: (typeof TEMPLATES)[number]): CtxItem[] => [
    { label: t("app.useTemplate"), icon: <BookOpen size={13} />, onSelect: () => createFromTemplate(template.key) },
    { label: t("app.copyKey"), icon: <ClipboardCopy size={13} />, onSelect: () => void copyText(template.key) },
  ];

  const createFromTemplate = (key: string) => {
    const { pkg, descriptor } = buildTemplateProject(key);
    addRecent(descriptor);
    openProject(pkg);
    setCreating(false);
    setView("workspace");
  };

  const openFromDialog = async () => {
    const pkg = await openProjectFile();
    if (!pkg) return;
    addRecent({
      id: "",
      title: pkg.metadata.title,
      author: pkg.metadata.author,
      type: pkg.metadata.type,
      language: pkg.metadata.language,
      createdAt: pkg.metadata.created_at,
      updatedAt: pkg.metadata.updated_at,
      wordCount: 0,
      sceneCount: 0,
    });
    openProject(pkg);
    setView("workspace");
  };

  const openRecentProject = async (descriptor: ProjectDescriptor) => {
    if (descriptor.filePath) {
      const pkg = await openProjectPath(descriptor.filePath);
      if (pkg) {
        openProject(pkg);
        setView("workspace");
        return;
      }
    }
    await openFromDialog();
  };

  const filtered = recent.filter(
    (p) =>
      !filter ||
      p.title.toLowerCase().includes(filter.toLowerCase()) ||
      p.author.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-10 overflow-y-auto px-10 py-8">
      <TemplateModal
        open={creating}
        onClose={() => setCreating(false)}
        onPick={createFromTemplate}
      />

      {/* Hero */}
      <header className="flex items-end justify-between pt-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.21, 1.02, 0.73, 1] }}
            className="text-4xl font-semibold tracking-tight text-ink"
          >
            {t("app.name")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-sm text-ink-muted"
          >
            {t("app.tagline")}
          </motion.p>
        </div>

        <div className="flex items-center gap-2">
          <button className={btn("primary")} onClick={() => setCreating(true)}>
            <Plus size={16} /> {t("app.newProject")}
          </button>
          <button className={btn("ghost")} onClick={openFromDialog}>
            <FolderOpen size={16} /> {t("app.openProject")}
          </button>
          <button className={btn("ghost")} onClick={openFromDialog}>
            <FileUp size={16} /> {t("app.importFountain")}
          </button>
          <button className={btn("ghost")} onClick={() => setView("settings")}>
            <Settings size={16} /> {t("app.settings")}
          </button>
        </div>
      </header>

      {/* Recent projects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            {t("app.recentProjects")}
          </h2>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("app.search")}
              className="input h-9 w-52 rounded-xl border border-line bg-surface pl-9 text-sm text-ink outline-none focus:border-accent/50"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-line bg-surface/60 text-sm text-ink-muted">
            <FileText className="mb-3 opacity-40" size={28} />
            {t("app.noProjects")}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((project) => (
              <motion.button
                key={project.title + project.updatedAt}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ y: -3 }}
                onClick={() => void openRecentProject(project)}
                onContextMenu={(e) => openContextMenu(e, recentMenu(project))}
                className="group rounded-2xl border border-line bg-surface text-left shadow-card transition-colors hover:border-accent/40"
              >
                <div
                  className="flex h-20 items-center justify-center rounded-t-2xl text-white"
                  style={{ background: project.thumbnail?.accent ?? "#6366f1" }}
                >
                  <FileText size={26} strokeWidth={1.6} className="opacity-80" />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-ink">{project.title || t("project.untitled")}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{TYPE_LABELS[project.type]}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-muted">
                    <span>{t("project.words", { count: project.wordCount })}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Templates */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          {t("app.templates")}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICONS[template.icon] ?? Clapperboard;
            return (
              <motion.button
                key={template.key}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => createFromTemplate(template.key)}
                onContextMenu={(e) => openContextMenu(e, templateMenu(template))}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface/60 p-4 text-left transition-colors hover:border-accent/40"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: template.color }}
                >
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{t(template.labelKey)}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{t(template.descKey)}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {ctxMenu}
    </div>
  );
}

function TemplateModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (key: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl border border-line bg-surface-raised p-6 shadow-glass"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">{t("app.templates")}</h3>
              <button className={btn("ghost")} onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((template) => {
                const Icon = TEMPLATE_ICONS[template.icon] ?? Clapperboard;
                return (
                  <button
                    key={template.key}
                    onClick={() => onPick(template.key)}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-accent/40"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: template.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">{t(template.labelKey)}</span>
                      <span className="block text-xs text-ink-muted">{t(template.descKey)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function btn(variant: "primary" | "ghost"): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
    variant === "primary"
      ? "bg-accent text-white shadow-card hover:opacity-90"
      : "border border-line bg-surface/60 text-ink hover:border-accent/40",
  );
}