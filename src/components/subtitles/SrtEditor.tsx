import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Merge,
  Split,
  Trash2 as Trash,
  Download,
  Upload,
  Play,
  Pause,
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { msToSrt, cpsFor, parseTimecode } from "@/utils/timecode";
import { cuesToSrt, cuesToVtt } from "@/utils/exporter";
import { parseSrt, parseVtt } from "@/utils/srt";
import { saveTextToFile } from "@/lib/io";
import type { SubtitleCue } from "@/types/script";
import { cn } from "@/utils/cn";

const MAX_PS = 15; // characters per second threshold
const MAX_LINES = 2;

interface CueRow extends SubtitleCue {
  cps: number;
  lineCount: number;
  tooLong: boolean;
  tooManyLines: boolean;
  overlaps: boolean;
}

export function SrtEditor() {
  const { t } = useTranslation();
  const cues = useProjectStore((s) => s.subtitles);
  const setCues = useProjectStore((s) => s.setSubtitles);
  const activePkg = useProjectStore((s) => (s.activeId ? s.openTabs[s.activeId] : null));
  const language = activePkg?.metadata.language ?? "en";

  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlayback] = useState(false);

  const rows = useMemo<CueRow[]>(() => {
    return cues.map((cue, index) => {
      const next = cues[index + 1];
      const cps = cpsFor(cue);
      return {
        ...cue,
        cps,
        lineCount: cue.text.split("\n").length,
        tooLong: cps > MAX_PS,
        tooManyLines: cue.text.split("\n").length > MAX_LINES,
        overlaps: next ? cue.endMs > next.startMs : false,
      };
    });
  }, [cues]);

  const totalMs = rows.length ? rows[rows.length - 1].endMs : 10_000;
  const scale = totalMs / 12_000;

  const updateCue = (id: number, patch: Partial<SubtitleCue>) => {
    setCues(cues.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCue = () => {
    const last = cues[cues.length - 1];
    const start = last ? last.endMs + 200 : 0;
    const enriched: SubtitleCue = {
      id: Date.now(),
      startMs: start,
      endMs: start + 1500,
      text: "",
    };
    setCues([...cues, enriched]);
    setSelected(enriched.id);
  };

  const removeCue = (id: number) => {
    setCues(cues.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  };

  const splitCue = (id: number) => {
    const cue = cues.find((c) => c.id === id);
    if (!cue) return;
    const mid = cue.startMs + Math.round((cue.endMs - cue.startMs) / 2);
    const lines = cue.text.split("\n");
    const half = lines.length > 1 ? Math.ceil(lines.length / 2) : 1;
    const a = lines.slice(0, half).join("\n");
    const b = lines.slice(half).join("\n");
    const next: SubtitleCue[] = [
      ...cues.filter((c) => c.id !== id),
      { id: Date.now() + 1, startMs: cue.startMs, endMs: mid, text: a },
      { id: Date.now() + 2, startMs: mid, endMs: cue.endMs, text: b },
    ].sort((x, y) => x.startMs - y.startMs);
    setCues(next);
  };

  const mergeCue = (id: number) => {
    const index = cues.findIndex((c) => c.id === id);
    if (index < 0 || index >= cues.length - 1) return;
    const a = cues[index];
    const b = cues[index + 1];
    setCues([
      ...cues.slice(0, index),
      { id: a.id, startMs: a.startMs, endMs: b.endMs, text: `${a.text}\n${b.text}` },
      ...cues.slice(index + 2),
    ]);
    setSelected(a.id);
  };

  const exportSrt = async () => {
    await saveTextToFile(cuesToSrt(cues), "subtitles.srt", { name: "SRT", extensions: ["srt"] }, "text/plain");
  };
  const exportVtt = async () => {
    await saveTextToFile(cuesToVtt(cues), "subtitles.vtt", { name: "VTT", extensions: ["vtt"] }, "text/vtt");
  };
  const importSrt = async () => {
    const raw = await pickSubtitleFile(".srt,.vtt");
    if (!raw) return;
    const parsed = raw.name.endsWith(".vtt") ? parseVtt(raw.text) : parseSrt(raw.text);
    setCues(parsed);
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface/70 px-3 py-1.5 backdrop-blur-md">
        <ToolButton onClick={() => addCue()}>
          <Plus size={15} /> {t("subtitles.add")}
        </ToolButton>
        <ToolButton disabled={selected == null} onClick={() => selected != null && splitCue(selected)}>
          <Split size={15} /> {t("subtitles.split")}
        </ToolButton>
        <ToolButton disabled={selected == null} onClick={() => selected != null && mergeCue(selected)}>
          <Merge size={15} /> {t("subtitles.merge")}
        </ToolButton>
        <ToolButton disabled={selected == null} onClick={() => selected != null && removeCue(selected)}>
          <Trash size={15} /> {t("subtitles.delete")}
        </ToolButton>
        <div className="mx-1 h-5 w-px bg-line" />
        <ToolButton onClick={() => setPlayback((v) => !v)}>
          {playing ? <Pause size={15} /> : <Play size={15} />} Preview
        </ToolButton>
        <div className="flex-1" />
        <ToolButton onClick={() => void importSrt()}>
          <Upload size={15} /> {t("subtitles.importSrt")}
        </ToolButton>
        <ToolButton onClick={() => void exportSrt()}>
          <Download size={15} /> {t("subtitles.exportSrt")}
        </ToolButton>
        <ToolButton onClick={() => void exportVtt()}>
          <Download size={15} /> VTT
        </ToolButton>
      </div>

      {/* Timeline band */}
      <div className="relative h-20 shrink-0 border-b border-line bg-surface-muted/40">
        {rows.map((row, i) => {
          const x = row.startMs * scale;
          const width = Math.max(3, (row.endMs - row.startMs) * scale);
          const active = selected === row.id;
          return (
            <button
              key={row.id}
              onClick={(e) => { e.stopPropagation(); setSelected(row.id); }}
              className={cn(
                "absolute top-1 flex h-20 flex-col justify-center overflow-hidden rounded-md border px-1.5 text-left transition-colors",
                active ? "z-10 border-accent bg-accent/25" : "border-line bg-surface",
                row.overlaps && "border-red-400/60",
                row.tooLong && "bg-amber-400/20",
              )}
              style={{ left: x, width }}
              title={`#${i + 1} ${msToSrt(row.startMs)} → ${msToSrt(row.endMs)}`}
            >
              <span className="truncate text-[10px] text-ink-muted">{row.text.split("\n")[0] || `#${i + 1}`}</span>
              <span className={cn("text-[9px]", row.tooLong ? "text-amber-500" : "text-ink-muted")}>
                {row.cps.toFixed(1)} CPS
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-ink-muted">
            {t("subtitles.empty")}
            <IconBtn title={t("subtitles.add")} onClick={() => addCue()}>
              <Plus size={14} />
            </IconBtn>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-raised text-xs text-ink-muted backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">{t("subtitles.start")}</th>
                <th className="px-3 py-2 text-left">{t("subtitles.end")}</th>
                <th className="px-3 py-2 text-left">{t("subtitles.text")}</th>
                <th className="px-3 py-2 text-right">{t("subtitles.cps")}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row.id)}
                  className={cn("cursor-pointer border-t border-line/60 transition-colors",
                    selected === row.id ? "bg-accent/10" : "hover:bg-surface-muted")}
                >
                  <td className="px-3 py-1.5 text-xs text-ink-muted">{i + 1}</td>
                  <td className="px-3 py-1.5">
                    <TimeInput
                      value={msToSrt(row.startMs)}
                      onChange={(v) => {
                        const ms = parseTimecode(v);
                        if (!Number.isNaN(ms)) updateCue(row.id, { startMs: ms });
                      }}
                      dir={directionOf(language)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <TimeInput
                      value={msToSrt(row.endMs)}
                      onChange={(v) => {
                        const ms = parseTimecode(v);
                        if (!Number.isNaN(ms)) updateCue(row.id, { endMs: ms });
                      }}
                      dir={directionOf(language)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <textarea
                      className={cn(
                        "w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm outline-none transition-colors hover:border-line focus:border-accent/50 focus:bg-surface",
                        row.tooManyLines && "text-amber-500",
                      )}
                      rows={Math.min(3, row.lineCount + 1)}
                      value={row.text}
                      onChange={(e) => updateCue(row.id, { text: e.target.value })}
                    />
                    {row.tooLong && (
                      <span className="text-[10px] text-amber-500">
                        {t("subtitles.cpsWarning", { limit: MAX_PS })}
                      </span>
                    )}
                  </td>
                  <td className={cn("px-3 py-1.5 text-right text-xs", row.tooLong ? "text-amber-500" : "text-ink-muted")}>
                    {row.cps.toFixed(1)}
                  </td>
                  <td className="px-1 py-1.5">
                    <IconBtn title={t("subtitles.delete")} onClick={() => removeCue(row.id)}>
                      <Trash size={13} />
                    </IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function directionOf(language: string): "ltr" | "rtl" {
  return language === "he" || language === "ar" ? "rtl" : "ltr";
}

function TimeInput({ value, onChange, dir }: { value: string; onChange: (v: string) => void; dir: "ltr" | "rtl" }) {
  return (
    <input
      dir={dir}
      className="rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-xs text-ink outline-none hover:border-line focus:border-accent/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ToolButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title?: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="rounded-md p-1 text-ink-muted hover:bg-surface-muted hover:text-ink">
      {children}
    </button>
  );
}

async function pickSubtitleFile(accept: string): Promise<{ text: string; name: string } | null> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  const files = await new Promise<File[] | null>((resolve) => {
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
  const file = files?.[0];
  return file ? { text: await file.text(), name: file.name } : null;
}
