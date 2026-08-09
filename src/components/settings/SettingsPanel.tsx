import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyRound,
  Server,
  Palette,
  PlugZap,
  X,
  Database,
  Monitor,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useAiStore, GEMINI_MODELS } from "@/store/aiStore";
import i18n, { setLanguage, type Language } from "@/i18n";
import { ollamaModels } from "@/lib/ai/ollama";
import { Field, inputClass, buttonClass } from "@/components/ui/primitives";
import { cn } from "@/utils/cn";

const SCRIPT_FONTS = [
  "Courier Prime",
  "Courier",
  "SF Pro",
  "David Libre",
  "Noto Sans Arabic",
  "Arial",
];

const LANGS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "he", label: "עברית" },
  { value: "ar", label: "العربية" },
  { value: "ru", label: "Русский" },
];

const PALETTE = ["#6366f1", "#0ea5e9", "#20c997", "#f59e0b", "#ec4899", "#ef4444"];

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();

  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const accent = useAppStore((s) => s.accent);
  const setAccent = useAppStore((s) => s.setAccent);
  const editor = useAppStore((s) => s.editor);
  const patchEditor = useAppStore((s) => s.patchEditor);
  const setView = useAppStore((s) => s.setView);

  const provider = useAiStore((s) => s.provider);
  const setProvider = useAiStore((s) => s.setProvider);
  const geminiKey = useAiStore((s) => s.geminiKey);
  const setGeminiKey = useAiStore((s) => s.setGeminiKey);
  const geminiModel = useAiStore((s) => s.geminiModel);
  const setGeminiModel = useAiStore((s) => s.setGeminiModel);
  const ollamaUrl = useAiStore((s) => s.ollamaUrl);
  const setOllamaUrl = useAiStore((s) => s.setOllamaUrl);
  const ollamaModel = useAiStore((s) => s.ollamaModel);
  const setOllamaModel = useAiStore((s) => s.setOllamaModel);

  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  const close = () => {
    if (onClose) onClose();
    else setView("landing");
  };

  const testConnection = async () => {
    if (provider === "gemini") {
      setStatus(geminiKey.trim() ? "ok" : "fail");
      return;
    }
    try {
      const list = await ollamaModels(ollamaUrl);
      if (list.length) setModels(list);
      setStatus(list.length ? "ok" : "fail");
    } catch {
      setStatus("fail");
    }
  };

  const activeLang = (i18n.resolvedLanguage ?? "en") as Language;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col overflow-y-auto px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{t("settings.title")}</h1>
        <button className={buttonClass("ghost")} onClick={close}>
          <X size={15} />
        </button>
      </div>

      {/* AI */}
      <Section icon={<KeyRound size={15} />} title={t("settings.aiSection")}>
        <div className="mb-4 flex gap-1 rounded-xl border border-line p-1">
          {(["gemini", "ollama"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize",
                provider === p ? "bg-accent text-white" : "text-ink-muted hover:bg-surface-muted",
              )}
            >
              {p === "gemini" ? t("ai.gemini") : t("ai.ollama")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Field label={t("settings.geminiKey")}>
            <div className="relative">
              <KeyRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className={cn(inputClass, "pl-9")}
              />
            </div>
          </Field>
          <Field label={t("settings.geminiModel")}>
            <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} className={inputClass}>
              {GEMINI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <Field label={t("settings.ollamaUrl")}>
            <div className="relative">
              <Server size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} className={cn(inputClass, "pl-9")} />
            </div>
          </Field>
          <Field label={t("settings.ollamaModel")}>
            <div className="flex gap-2">
              <select value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className={inputClass}>
                {models.length
                  ? models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  : [
                      <option key="typed" value={ollamaModel}>
                        {ollamaModel || "llama3.2"}
                      </option>,
                    ]}
              </select>
              <button className={buttonClass("ghost")} onClick={() => void testConnection()}>
                <PlugZap size={14} /> {t("settings.refreshModels")}
              </button>
            </div>
          </Field>
          <span
            className={cn(
              "text-xs",
              status === "ok" && "text-green-500",
              status === "fail" && "text-red-400",
            )}
          >
            {status === "ok" && t("settings.connected")}
            {status === "fail" && t("settings.failed")}
          </span>
        </div>
      </Section>

      {/* Editor */}
      <Section icon={<Database size={15} />} title={t("settings.editorSection")}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("settings.scriptFont")}>
            <select
              value={editor.scriptFont}
              onChange={(e) => patchEditor({ scriptFont: e.target.value })}
              className={inputClass}
            >
              {SCRIPT_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`${t("settings.fontSize")} — ${editor.fontSize}pt`}>
            <input
              type="range"
              min={11}
              max={26}
              step={0.5}
              value={editor.fontSize}
              onChange={(e) => patchEditor({ fontSize: Number(e.target.value) })}
              className="mt-3 w-full"
            />
          </Field>
          <Field label={`${t("settings.lineHeight")} — ×${editor.lineHeight.toFixed(2)}`}>
            <input
              type="range"
              min={0.8}
              max={2.2}
              step={0.05}
              value={editor.lineHeight}
              onChange={(e) => patchEditor({ lineHeight: Number(e.target.value) })}
              className="mt-3 w-full"
            />
          </Field>
          <Field label={`${t("settings.autoSave")} (s)`}>
            <input
              type="number"
              min={0}
              max={120}
              value={editor.autoSaveSeconds}
              onChange={(e) => patchEditor({ autoSaveSeconds: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={<Palette size={15} />} title={t("settings.appearanceSection")}>
        <div className="mb-4 flex gap-2">
          {(["system", "light", "dark"] as const).map((themeKey) => (
            <button
              key={themeKey}
              onClick={() => setTheme(themeKey)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                theme === themeKey
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line text-ink-muted hover:border-accent/30",
              )}
            >
              {t(`settings.theme${cap(themeKey)}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-muted">{t("settings.accent")}</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-lg border border-line bg-transparent"
          />
          <div className="flex gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                className="h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Interface / i18n */}
      <Section icon={<Monitor size={15} />} title={t("settings.interfaceSection")}>
        <Field label={t("settings.language")}>
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                  activeLang === l.value
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-line text-ink-muted hover:border-accent/30",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="flex items-center gap-2 pt-3 text-sm text-ink-muted">
          <Monitor size={14} />
          <span>
            {t("settings.direction")}: {activeLang === "he" || activeLang === "ar" ? "RTL" : "LTR"}
          </span>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-line bg-surface-raised p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}