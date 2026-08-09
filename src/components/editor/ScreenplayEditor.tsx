import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Type,
  Film,
  AlignLeft,
  AlignRight,
  Quote,
  FileUser,
  MoveRight,
  Captions,
  List,
  Sparkles,
  Bot,
  Save,
  Download,
  X,
} from "lucide-react";
import { ScriptElement } from "@/types/script";
import { ScriptElementNode } from "@/extensions/scriptElement";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { editorToNodes, nodesToDoc } from "@/editor/convert";
import { saveProjectToFile, saveTextToFile } from "@/lib/io";
import {
  nodesToFountain,
  nodesToFdx,
  nodesToPlainText,
  nodesToPdfBlob,
  downloadBlob,
} from "@/utils/exporter";
import { cn } from "@/utils/cn";

const ELEMENTS: { value: ScriptElement; label: string; icon: React.ElementType }[] = [
  { value: ScriptElement.SceneHeading, label: "Scene Heading", icon: Film },
  { value: ScriptElement.Action, label: "Action", icon: Type },
  { value: ScriptElement.Character, label: "Character", icon: FileUser },
  { value: ScriptElement.Dialogue, label: "Dialogue", icon: Quote },
  { value: ScriptElement.Parenthetical, label: "Parenthetical", icon: AlignLeft },
  { value: ScriptElement.Transition, label: "Transition", icon: MoveRight },
  { value: ScriptElement.Shot, label: "Shot", icon: Captions },
];

import type { RevisionColor } from "@/types/script";

const REVISION_STYLES: { value: RevisionColor | null; color: string }[] = [
  { value: null, color: "#94a3b8" },
  { value: "white", color: "#ffffff" },
  { value: "blue", color: "#3b82f6" },
  { value: "pink", color: "#ec4899" },
  { value: "yellow", color: "#fbbf24" },
  { value: "green", color: "#22c55e" },
  { value: "salmon", color: "#fb7185" },
  { value: "cherry", color: "#ef4444" },
  { value: "goldenrod", color: "#eab308" },
];

type ExportFormat = "ascript" | "fountain" | "fdx" | "txt" | "pdf";

export function ScreenplayEditor() {
  const { t } = useTranslation();
  const nodes = useProjectStore((s) => s.nodes);
  const setNodes = useProjectStore((s) => s.setNodes);
  const activePkg = useProjectStore((s) => (s.activeId ? s.openTabs[s.activeId] : null));
  const addRecent = useProjectStore((s) => s.addRecent);
  const focusMode = useAppStore((s) => s.focusMode);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const toggleAiPanel = useAppStore((s) => s.toggleAiPanel);

  const [showOutline, setShowOutline] = useState(false);
  const [currentElement, setCurrentElement] = useState<ScriptElement>(ScriptElement.Action);
  const [exportOpen, setExportOpen] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const initialContent = useMemo(() => nodesToDoc(nodes), []);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          codeBlock: false,
          blockquote: false,
        }),
        Underline,
        Placeholder.configure({
          placeholder:
            activePkg?.metadata.type === "screenplay"
              ? "INT. LOCATION — DAY\n\nBegin your scene…"
              : "Begin your manuscript…",
        }),
        ScriptElementNode,
      ],
      content: initialContent,
      editorProps: {
        attributes: { class: "outline-none", spellcheck: "true" },
      },
      onUpdate: ({ editor }) => {
        setNodes(editorToNodes(editor));
      },
      onSelectionUpdate: ({ editor }) => {
        const el = editor.state.selection.$from.parent.attrs?.element as ScriptElement | undefined;
        if (el) setCurrentElement(el);
      },
    },
    [],
  );

  const savePackage = useCallback(async () => {
    if (!activePkg) return;
    const path = await saveProjectToFile(activePkg);
    if (path) {
      addRecent({
        id: `${activePkg.metadata.type}-${activePkg.metadata.language}-${activePkg.metadata.title}-${activePkg.metadata.created_at}`,
        title: activePkg.metadata.title,
        author: activePkg.metadata.author,
        type: activePkg.metadata.type,
        language: activePkg.metadata.language,
        createdAt: activePkg.metadata.created_at,
        updatedAt: activePkg.metadata.updated_at,
        wordCount: nodes.reduce((a, n) => a + n.text.split(/\s+/).filter(Boolean).length, 0),
        sceneCount: nodes.length,
        filePath: path,
      });
    }
  }, [activePkg, addRecent, nodes]);

  const exportProject = useCallback(
    async (format: ExportFormat) => {
      setExportOpen(false);
      const snapshot = editor ? editorToNodes(editor) : nodes;
      const base = (activePkg?.metadata.title || "untitled").replace(/\s+/g, "-").toLowerCase();

      switch (format) {
        case "ascript":
          await savePackage();
          break;
        case "fountain":
          await saveTextToFile(nodesToFountain(snapshot), `${base}.fountain`, {
            name: "Fountain",
            extensions: ["fountain"],
          });
          break;
        case "fdx":
          await saveTextToFile(nodesToFdx(snapshot), `${base}.fdx`, {
            name: "Final Draft",
            extensions: ["fdx"],
          }, "text/xml");
          break;
        case "txt":
          await saveTextToFile(nodesToPlainText(snapshot), `${base}.txt`, {
            name: "Plain text",
            extensions: ["txt"],
          });
          break;
        case "pdf": {
          const blob = await nodesToPdfBlob(snapshot, activePkg?.metadata.title ?? "");
          downloadBlob(blob, `${base}.pdf`);
          break;
        }
      }
    },
    [editor, nodes, activePkg, savePackage],
  );

  const outline = useMemo(() => {
    const result: { text: string; pos: number }[] = [];
    editor?.state.doc.forEach((blk, offset) => {
      if ((blk.attrs.element as ScriptElement | undefined) === ScriptElement.SceneHeading) {
        result.push({ text: blk.textContent, pos: offset });
      }
    });
    return result;
  }, [editor]);

  const gotoHeading = useCallback(
    (pos: number) => {
      if (!editor) return;
      editor.commands.setTextSelection(pos + 1);
      editor.commands.scrollIntoView();
    },
    [editor],
  );

  const applyElement = (el: ScriptElement) => editor?.commands.setElement(el);
  const applyDirection = (dir: "ltr" | "rtl") => editor?.commands.setDirection(dir);
  const applyRevision = (rev: (typeof REVISION_STYLES)[number]["value"]) =>
    editor?.commands.setRevision(rev);

  const pageWidth = activePkg?.metadata.type === "manuscript" ? "max-w-2xl" : "max-w-3xl";

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* -------------------------------------------------- toolbar */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface/70 px-3 py-1.5 backdrop-blur-md">
        {ELEMENTS.map((el) => {
          const Icon = el.icon;
          return (
            <button
              key={el.value}
              title={el.label}
              onClick={() => applyElement(el.value)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink",
                currentElement === el.value && "bg-accent/15 text-accent",
              )}
            >
              <Icon size={15} />
            </button>
          );
        })}

        <div className="mx-1 h-5 w-px bg-line" />
        <IconButton title="LTR" onClick={() => applyDirection("ltr")}>
          <AlignLeft size={14} />
        </IconButton>
        <IconButton title="RTL" onClick={() => applyDirection("rtl")}>
          <AlignRight size={14} />
        </IconButton>

        <div className="relative">
          <RevisionMenu onChange={(v) => applyRevision(v)} />
        </div>

        <div className="mx-1 h-5 w-px bg-line" />
        <IconButton title={t("editor.outline")} active={showOutline} onClick={() => setShowOutline((v) => !v)}>
          <List size={15} />
        </IconButton>
        <IconButton title={t("editor.zen")} active={focusMode} onClick={() => setFocusMode(!focusMode)}>
          <Sparkles size={15} />
        </IconButton>
        <IconButton title={t("ai.title")} onClick={toggleAiPanel}>
          <Bot size={15} />
        </IconButton>

        <div className="flex-1" />
        <span className="mx-1 h-5 w-px bg-line" />

        <div className="relative">
          <IconButton title="Export" active={exportOpen} onClick={() => {
            setExportOpen((v) => !v);
            setShowOutline(false);
          }}>
            <Download size={15} />
          </IconButton>
          {exportOpen && (
            <div className="absolute right-0 top-10 z-30 w-40 rounded-xl border border-line bg-surface-raised p-1.5 shadow-glass">
              {(
                [
                  ["ascript", "AgamIz (.ascript)"],
                  ["fountain", "Fountain (.fountain)"],
                  ["fdx", "Final Draft (.fdx)"],
                  ["txt", "Plain text (.txt)"],
                  ["pdf", "PDF"],
                ] as [ExportFormat, string][]
              ).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => void exportProject(f)}
                  className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-muted"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton title={t("app.save")} onClick={() => void savePackage()}>
          <Save size={15} />
        </IconButton>
      </div>

      {/* -------------------------------------------------- body */}
      <div className="flex min-h-0 flex-1">
        {showOutline && (
          <aside className="w-60 shrink-0 border-r border-line bg-surface/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                {t("editor.outline")}
              </p>
              <button className="text-ink-muted hover:text-ink" onClick={() => setShowOutline(false)}>
                <X size={12} />
              </button>
            </div>
            {outline.length === 0 && <p className="text-xs text-ink-muted">—</p>}
            {outline.map((h) => (
              <button
                key={h.pos}
                onClick={() => gotoHeading(h.pos)}
                className="mb-0.5 block w-full truncate rounded-lg px-2 py-1 text-left text-[11px] text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                {h.text}
              </button>
            ))}
          </aside>
        )}

        <div ref={surfaceRef} className="min-w-0 flex-1 overflow-y-auto">
          <div
            className={cn(
              "mx-auto my-6 min-h-[840px] rounded-2xl bg-surface-raised px-[9%] py-12 shadow-glass transition-all",
              pageWidth,
              focusMode && "shadow-none",
            )}
            dir={activePkg?.metadata.direction ?? "auto"}
          >
            <div className="mb-8">
              <input
                readOnly
                value={activePkg?.metadata.title ?? ""}
                className="w-full bg-transparent text-center text-xl font-semibold text-ink outline-none"
                aria-label="Title"
              />
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Small building blocks                                             */
/* ---------------------------------------------------------------- */

function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink",
        active && "bg-accent/15 text-accent",
      )}
    >
      {children}
    </button>
  );
}

function RevisionMenu({ onChange }: { onChange: (value: RevisionColor | null) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<RevisionColor | null>(null);
  const apply = (v: RevisionColor | null) => {
    setValue(v);
    setOpen(false);
    onChange(v);
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-ink-muted hover:bg-surface-muted hover:text-ink",
          value && "bg-accent/15 text-accent",
        )}
      >
        <span
          className="h-3 w-3 rounded-full border border-black/20"
          style={{ background: REVISION_STYLES.find((r) => r.value === value)?.color ?? "transparent" }}
        />
        {value ?? "Revision"}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 rounded-xl border border-line bg-surface-raised p-1.5 shadow-glass">
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {REVISION_STYLES.map((r) => (
              <button
                key={r.value ?? "none"}
                title={r.value ?? "clear"}
                onClick={() => apply(r.value)}
                className="h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                style={{ background: r.color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}