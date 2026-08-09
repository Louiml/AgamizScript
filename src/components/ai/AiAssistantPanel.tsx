import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Bot,
  Sparkles,
  Send,
  Square,
  Copy,
  PenLine,
  Languages,
  Settings2,
  Trash2,
  Brain,
} from "lucide-react";
import { useAiStore, type AiTool } from "@/store/aiStore";
import { useAppStore } from "@/store/appStore";
import { useProjectStore } from "@/store/projectStore";
import { runAiTool } from "@/lib/ai";
import { cn } from "@/utils/cn";
import type { ProjectLanguage, ScriptNode } from "@/types/script";
import { ScriptElement, detectDirection } from "@/types/script";
import { uid } from "@/utils/cn";

const TOOLS: { id: AiTool; label: string; icon: React.ElementType }[] = [
  { id: "continue", label: "Continue scene", icon: PenLine },
  { id: "expand", label: "Expand beat", icon: Sparkles },
  { id: "summarize", label: "Summarize", icon: Brain },
  { id: "punchup", label: "Punch up dialogue", icon: PenLine },
  { id: "coverage", label: "Coverage", icon: Settings2 },
  { id: "translate", label: "Translate", icon: Languages },
  { id: "format", label: "Format pass", icon: Sparkles },
];

const LANGUAGES: { value: ProjectLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "he", label: "Hebrew" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
];

export function AiAssistantPanel({ getContext }: { getContext?: () => string }) {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);

  const provider = useAiStore((s) => s.provider);
  const busy = useAiStore((s) => s.busy);
  const streaming = useAiStore((s) => s.streaming);
  const messages = useAiStore((s) => s.messages);
  const geminiKey = useAiStore((s) => s.geminiKey);
  const ollamaUrl = useAiStore((s) => s.ollamaUrl);
  const setProvider = useAiStore((s) => s.setProvider);

  const nodes = useProjectStore((s) => s.nodes);
  const setNodes = useProjectStore((s) => s.setNodes);

  const [tool, setTool] = useState<AiTool>("continue");
  const [targetLang, setTargetLang] = useState<ProjectLanguage>("he");
  const [prompt, setPrompt] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const [copied, setCopied] = useState(false);

  const ready =
    provider === "gemini" ? Boolean(geminiKey.trim()) : Boolean(ollamaUrl.length);

  const execute = async () => {
    if (!ready) return;
    const controller = new AbortController();
    abortRef.current = controller;

    const text = getContext?.() ?? plainNodes(nodes);
    const instruction = prompt.trim();
    const context = instruction ? `${text}\n\n${instruction}` : text;

    useAiStore.getState().beginStream(tool, context);
    try {
      await runAiTool({
        tool,
        context,
        targetLanguage: tool === "translate" ? targetLang : undefined,
        onDelta: (delta) => useAiStore.getState().appendStream(delta),
        signal: controller.signal,
      });
      useAiStore.getState().finishStream();
    } catch (error) {
      useAiStore.getState().cancelStream();
      useAiStore.getState().beginStream(tool, String((error as Error).message || error));
      useAiStore.getState().finishStream();
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    useAiStore.getState().cancelStream();
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(streaming || lastAssistant(messages));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const insertToDraft = () => {
    const text = streaming || lastAssistant(messages);
    if (!text) return;
    const lines = text.split("\n").filter(Boolean);
    const newNodes: ScriptNode[] = lines.map((line) => ({
      id: uid(),
      element: looksLikeHeading(line) ? ScriptElement.SceneHeading : ScriptElement.Dialogue,
      text: line,
      direction: detectDirection(line),
    }));
    setNodes([...nodes, ...newNodes]);
  };

  const clearHistory = () => useAiStore.getState().clearMessages();

  return (
    <div className="flex h-full w-80 min-w-0 flex-col border-l border-line bg-surface-raised/80 shadow-glass backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        {provider === "gemini" ? <Sparkles size={16} className="text-accent" /> : <Bot size={16} className="text-accent" />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">{t("ai.title")}</p>
          <p className="text-[10px] text-ink-muted">{provider === "gemini" ? t("ai.gemini") : t("ai.ollama")}</p>
        </div>
        <EngineToggle provider={provider} onChange={setProvider} />
      </div>

      {/* Tools */}
      <div className="grid grid-cols-2 gap-1.5 p-3">
        {TOOLS.map((toolDef) => {
          const Icon = toolDef.icon;
          const active = tool === toolDef.id;
          return (
            <button
              key={toolDef.id}
              onClick={() => setTool(toolDef.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors",
                active
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line text-ink-muted hover:border-accent/30 hover:text-ink",
              )}
            >
              <Icon size={13} />
              {toolDef.label}
            </button>
          );
        })}
      </div>

      {tool === "translate" && (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[11px] font-medium text-ink-muted">{t("ai.mode")}:</span>
          <div className="flex flex-wrap gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => setTargetLang(l.value)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] transition-colors",
                  targetLang === l.value
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-surface-muted",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-xs text-ink-muted">
            {ready ? t("ai.collectingContext") : provider === "gemini" ? t("ai.ensureKey") : t("ai.ensureOllama")}
          </p>
        )}
        <div className="space-y-2">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "whitespace-pre-wrap rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                m.role === "user"
                  ? "ml-6 bg-accent/10 text-ink"
                  : "mr-6 border border-line bg-surface-raised text-ink",
              )}
            >
              {m.content}
            </motion.div>
          ))}
          {busy && (
            <div className="mr-6 rounded-xl border border-line bg-surface-raised px-3 py-2 text-[12px] leading-relaxed text-ink">
              {streaming}
              <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-accent align-middle" />
            </div>
          )}
        </div>
      </div>

      {/* Composer + actions */}
      <div className="border-t border-line p-3">
        {streaming || lastAssistant(messages) ? (
          <div className="mb-2 flex items-center gap-2">
            <ActionChip onClick={() => void copyDraft()} icon={<Copy size={12} />} label={copied ? t("ai.copied") : "Copy"} />
            <ActionChip onClick={insertToDraft} icon={<PenLine size={12} />} label={t("ai.insertBelow")} />
            <ActionChip onClick={clearHistory} icon={<Trash2 size={12} />} label="Clear" />
          </div>
        ) : null}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void execute();
          }}
          placeholder={t("ai.placeholder")}
          className="h-16 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent/50"
        />

        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => (busy ? stop() : void execute())}
            disabled={!ready}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white shadow-card transition-colors",
              busy ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:opacity-90",
              !ready && "cursor-not-allowed opacity-40",
            )}
          >
            {busy ? <Square size={13} /> : <Send size={13} />}
            {busy ? t("ai.stop") : t("ai.send")}
          </button>
          <button
            title={t("settings.title")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-muted hover:border-accent/40"
            onClick={() => setView("settings")}
          >
            <Settings2 size={15} />
          </button>
        </div>
        {!ready && (
          <p className="mt-2 text-[10px] text-ink-muted">
            {provider === "gemini" ? t("ai.ensureKey") : t("ai.ensureOllama")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function EngineToggle({
  provider,
  onChange,
}: {
  provider: "gemini" | "ollama";
  onChange: (p: "gemini" | "ollama") => void;
}) {
  return (
    <div className="flex rounded-lg border border-line p-0.5">
      {(["gemini", "ollama"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize",
            provider === p ? "bg-accent text-white" : "text-ink-muted",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function ActionChip({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] text-ink-muted hover:border-accent/40 hover:text-ink"
    >
      {icon} {label}
    </button>
  );
}

function plainNodes(nodes: ScriptNode[]): string {
  return nodes
    .filter((n) => n.text.trim())
    .slice(-80)
    .map((n) => n.text)
    .join("\n");
}

function lastAssistant(messages: { role: "user" | "assistant"; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].content;
  }
  return "";
}

function looksLikeHeading(line: string): boolean {
  return /^(INT|EXT|INT\.\/EXT|INT\/EXT|EST|SUPER)[\s.]/i.test(line.trim());
}