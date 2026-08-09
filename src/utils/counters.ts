import type { ScriptNode } from "@/types/script";
import { ScriptElement } from "@/types/script";

/** Count words from raw text (whitespace-bounded tokens, CJK-aware). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const cjk = (trimmed.match(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) ?? []).length;
  const latin = trimmed.split(/\s+/).filter(Boolean).length;
  return latin + cjk;
}

export function countCharacters(text: string): number {
  return Array.from(text).length;
}

const AVG_WORDS_PER_PAGE = 55;
const MANUSCRIPT_WORDS_PER_PAGE = 280;

/** Standard industry estimate: ~55 words / page for screenplay prose. */
export function estimatePages(words: number, mode: "screenplay" | "manuscript" = "screenplay"): number {
  const perPage = mode === "manuscript" ? MANUSCRIPT_WORDS_PER_PAGE : AVG_WORDS_PER_PAGE;
  return Math.max(1, Math.round(words / perPage));
}

export interface ScriptStats {
  words: number;
  characters: number;
  scenes: number;
  paragraphs: number;
  dialogueCues: number;
  pages: number;
}

/** Compute live statistics from a list of paragraph nodes. */
export function computeStats(nodes: ScriptNode[], mode: "screenplay" | "manuscript" = "screenplay"): ScriptStats {
  let words = 0;
  let characters = 0;
  let scenes = 0;
  let paragraphs = 0;
  let dialogueCues = 0;
  let pageBreaks = 0;

  for (const node of nodes) {
    words += countWords(node.text);
    characters += countCharacters(node.text);
    paragraphs += 1;
    switch (node.element) {
      case ScriptElement.SceneHeading:
        scenes += 1;
        break;
      case ScriptElement.Dialogue:
        dialogueCues += 1;
        break;
      case ScriptElement.PageBreak:
        pageBreaks += 1;
        break;
      default:
        break;
    }
  }

  return {
    words,
    characters,
    scenes,
    paragraphs,
    dialogueCues,
    pages: estimatePages(words, mode) + pageBreaks,
  };
}