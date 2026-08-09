import type { AiTool } from "@/store/aiStore";
import { useAiStore } from "@/store/aiStore";
import { generateGeminiStream } from "./gemini";
import { generateOllamaStream } from "./ollama";

/** System prompts that steer each AI tool. */
export const TOOL_PROMPTS: Record<AiTool, string> = {
  continue:
    "Continue the screenplay scene where it left off, preserving the established screenplay formatting (scene headings, action, character, dialogue) and the tone of the existing text. Output only the continuation.",
  expand:
    "Expand this beat/logline into a full scene with fleshed-out action lines and dialogue. Keep the screenplay formatting and pace tight.",
  summarize:
    "Condense the provided script into a logline plus a three-beat scene breakdown. Keep it concise.",
  punchup:
    "Rewrite the dialogue to strengthen voice, rhythm, subtext and emotional impact while preserving the meaning and character identity.",
  coverage:
    "Provide script coverage: logline, structure notes, pacing critique, character arc analysis, and formatting errors. Be constructive and specific.",
  translate:
    "Translate the script into the requested language while preserving screenplay formatting, character names, and cultural nuance.",
  format:
    "Normalize the provided screenplay per Fountain conventions: fix scene headings casing, action descriptions, character casing and transitions.",
};

export interface RunInput {
  tool: AiTool;
  context: string;
  instruction?: string;
  targetLanguage?: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}

/**
 * Dispatch a request to Gemini or Ollama and stream deltas into `onDelta`.
 */
export async function runAiTool({
  tool,
  context,
  instruction,
  targetLanguage,
  onDelta,
  signal,
}: RunInput): Promise<void> {
  const s = useAiStore.getState();

  let system = TOOL_PROMPTS[tool];
  if (tool === "translate" && targetLanguage) {
    system = `Translate the following script into ${targetLanguage}. Preserve screenplay element formatting and character names, and keep cultural nuance.`;
  }
  if (instruction && instruction.trim()) {
    system = `${system}\n\nAdditional instruction: ${instruction}`;
  }

  const prompt = context.trim();

  if (s.provider === "ollama") {
    await generateOllamaStream({
      url: s.ollamaUrl,
      model: s.ollamaModel,
      system,
      prompt,
      onDelta,
      signal,
    });
    return;
  }

  await generateGeminiStream({
    apiKey: s.geminiKey,
    model: s.geminiModel,
    system,
    prompt,
    onDelta,
    signal,
  });
}