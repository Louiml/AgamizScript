import type { ScriptNode, SubtitleCue } from "@/types/script";
import { ScriptElement } from "@/types/script";
import { msToSrt, msToVtt } from "@/utils/timecode";

/** One paragraph → its Fountain representation (markers preserved). */
function elementToFountain(node: ScriptNode): string {
  const text = node.text.trim();
  switch (node.element) {
    case ScriptElement.SceneHeading:
      return text.replace(/\.$/, "").replace(/\s+$/g, "");
    case ScriptElement.Action:
      return text;
    case ScriptElement.Character:
      return text;
    case ScriptElement.Parenthetical:
      return text.startsWith("(") ? text : `(${text})`;
    case ScriptElement.Dialogue:
      // `*` keeps dialogue unambiguous on import
      return `*${text}`;
    case ScriptElement.Transition:
      return /^>.*>$/.test(text) ? text : `>${text}`;
    case ScriptElement.Shot:
    case ScriptElement.Centered:
      return text.startsWith(">") ? text : `>${text}<`;
    case ScriptElement.Lyrics:
      return `~${text}`;
    case ScriptElement.PageBreak:
      return "===";
    default:
      return text;
  }
}

/** Serialize paragraph nodes into a Fountain document. */
export function nodesToFountain(nodes: ScriptNode[]): string {
  const lines: string[] = [];

  const push = (line: string) => {
    if (line === "===") {
      if (lines.length === 0 || lines[lines.length - 1] === "===") return;
    }
    lines.push(line);
  };

  for (const node of nodes) {
    const raw = elementToFountain(node);
    if (raw === null) continue;
    push(raw);
  }
  return lines.join("\n");
}

export const fountainFromNodes = nodesToFountain;

/* ------------------------------------------------------------------ */
/* Plain text                                                          */
/* ------------------------------------------------------------------ */

export function nodesToPlainText(nodes: ScriptNode[]): string {
  return nodes
    .filter((n) => n.element !== ScriptElement.PageBreak)
    .map((n) => n.text)
    .join("\n\n");
}

/* ------------------------------------------------------------------ */
/* SRT / VTT                                                           */
/* ------------------------------------------------------------------ */

export function cuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      const text = normalizeCueText(cue.text);
      return `${index + 1}\n${msToSrt(cue.startMs)} --> ${msToSrt(cue.endMs)}\n${text}`;
    })
    .join("\n\n") + "\n";
}

export function cuesToVtt(cues: SubtitleCue[]): string {
  const blocks = cues.map((cue, index) => {
    if (index === 0) {
      return `00:00:00.000 --> ${msToVtt(cue.endMs)}\n${normalizeCueText(cue.text)}`;
    }
    return `${msToVtt(cue.startMs)} --> ${msToVtt(cue.endMs)}\n${normalizeCueText(cue.text)}`;
  });
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

function normalizeCueText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ------------------------------------------------------------------ */
/* FDX (Final Draft XML)                                                */
/* ------------------------------------------------------------------ */

const FDX_TYPE: Record<ScriptElement, string> = {
  [ScriptElement.SceneHeading]: "Scene Heading",
  [ScriptElement.Action]: "Action",
  [ScriptElement.Character]: "Character",
  [ScriptElement.Dialogue]: "Dialogue",
  [ScriptElement.Parenthetical]: "Parenthetical",
  [ScriptElement.Transition]: "Transition",
  [ScriptElement.Shot]: "Shot",
  [ScriptElement.Lyrics]: "Song",
  [ScriptElement.Centered]: "General",
  [ScriptElement.PageBreak]: "Page Break",
  [ScriptElement.Null]: "Note",
};

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Emit a well-formed Final Draft `.fdx` document. */
export function nodesToFdx(nodes: ScriptNode[]): string {
  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>');
  parts.push('<FinalDraft DocumentType="Script" Template="No" Version="1.0.1">');
  parts.push("<Content>");
  for (const node of nodes) {
    const type = FDX_TYPE[node.element] ?? "Action";
    parts.push(`  <Paragraph Type="${type}">`);
    parts.push(`    <Text>${xmlEscape(node.text)}</Text>`);
    parts.push(`  </Paragraph>`);
  }
  parts.push("</Content>");
  parts.push("</FinalDraft>");
  return parts.join("\n") + "\n";
}

/* ------------------------------------------------------------------ */
/* PDF (industry-standard margins via jsPDF)                            */
/* ------------------------------------------------------------------ */

export async function nodesToPdfBlob(nodes: ScriptNode[], _title: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  doc.setFont("courier", "normal");
  doc.setFontSize(12);

  const left = 72; // 1 inch
  const rightMax = 540; // 1 inch right margin
  const top = 72;
  const bottom = 738;
  const lineHeight = 14.4;

  let y = top;

  const newPage = () => {
    doc.addPage();
    y = top;
  };

  const write = (text: string, x: number, width: number, bold = false) => {
    doc.setFont("courier", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text || " ", width) as string[];
    for (const line of lines) {
      if (y + lineHeight > bottom) newPage();
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  for (const node of nodes) {
    const el = node.element;
    if (el === ScriptElement.PageBreak) {
      newPage();
      continue;
    }
    if (!node.text.trim()) continue;

    if (el === ScriptElement.SceneHeading) {
      if (y > top + 24) newPage();
      write(node.text, left, rightMax - left, true);
      y += 12;
    } else if (el === ScriptElement.Character) {
      write(node.text, left + 180, 288);
    } else if (el === ScriptElement.Dialogue) {
      write(node.text, left + 84, 288);
    } else if (el === ScriptElement.Parenthetical) {
      write(node.text, left + 120, 264);
    } else if (el === ScriptElement.Transition) {
      write(node.text, rightMax - 132, 132);
    } else if (el === ScriptElement.Shot) {
      write(node.text, left + 144, 288);
    } else {
      write(node.text, left, rightMax - left);
      y += 6;
    }
  }

  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text(String(page), 306, 768, { align: "center" });
  }

  return doc.output("blob");
}

/* ------------------------------------------------------------------ */
/* Download helper (works in browser + Tauri webview)                   */
/* ------------------------------------------------------------------ */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}