import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiProvider = "gemini" | "ollama";
export type AiTool =
  | "continue"
  | "expand"
  | "summarize"
  | "punchup"
  | "coverage"
  | "translate"
  | "format";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  tool?: AiTool;
  time: number;
}

interface AiState {
  provider: AiProvider;
  geminiKey: string;
  geminiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  busy: boolean;
  streaming: string;
  messages: AiMessage[];
  lastTool: AiTool;

  setProvider: (provider: AiProvider) => void;
  setGeminiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setOllamaUrl: (url: string) => void;
  setOllamaModel: (model: string) => void;
  beginStream: (tool: AiTool, userContent: string) => void;
  appendStream: (delta: string) => void;
  finishStream: () => void;
  cancelStream: () => void;
  clearMessages: () => void;
}

export const GEMINI_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
] as const;

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      provider: "gemini",
      geminiKey: "",
      geminiModel: "gemini-1.5-pro",
      ollamaUrl: "http://127.0.0.1:11434",
      ollamaModel: "llama3.2",
      busy: false,
      streaming: "",
      messages: [],
      lastTool: "continue",

      setProvider: (provider) => set({ provider, streaming: "", lastTool: "continue" }),
      setGeminiKey: (geminiKey) => set({ geminiKey }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
      setOllamaModel: (ollamaModel) => set({ ollamaModel }),

      beginStream: (tool, userContent) =>
        set((s) => ({
          busy: true,
          streaming: "",
          lastTool: tool,
          messages: [...s.messages, { role: "user", content: userContent, time: Date.now() }],
        })),

      appendStream: (delta) => set((s) => ({ streaming: s.streaming + delta })),

      finishStream: () =>
        set((s) => ({
          busy: false,
          messages: [
            ...s.messages,
            { role: "assistant", content: s.streaming, tool: s.lastTool, time: Date.now() },
          ],
          streaming: "",
        })),

      cancelStream: () => set({ busy: false, streaming: "" }),
      clearMessages: () => set({ messages: [], streaming: "" }),
    }),
    {
      name: "agamiz-ai",
      partialize: (s) => ({
        provider: s.provider,
        geminiKey: s.geminiKey,
        geminiModel: s.geminiModel,
        ollamaUrl: s.ollamaUrl,
        ollamaModel: s.ollamaModel,
      }),
    },
  ),
);