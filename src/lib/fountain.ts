import type { ScriptNode } from "@/types/script";
import { ScriptElement, detectDirection } from "@/types/script";
import { uid } from "@/utils/cn";

const SCENE_REGEX = /^(INT|EXT|INT\.\/EXT|INT\/EXT|EST|SUPER)\.?[.\s]/i;
const TRANSITION_LABELS =
  /^(CUT TO|FADE (IN|OUT|TO (BLACK|WHITE)|OUT\b)|MATCH CUT|SMASH CUT|JUMP CUT|DISSOLVE TO|WIPE TO|MIX TO|INTERCUT|IRIS|MONTAGE)/i;
const LYRIC_PREFIX = /^~/;
const DIALOGUE_MARK = /^\*/;
const CAPS_LINE = /^[A-Z0-9\s,.'"!:?-]+$/;

function makeNode(element: ScriptElement, text: string): ScriptNode {
  return {
    id: uid(),
    element,
    text,
    direction: detectDirection(text),
  };
}

/** All-caps, fairly short, no scene-prefix → likely a character cue. */
function looksLikeCharacter(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 45) return false;
  if (SCENE_REGEX.test(t)) return false;
  if (!CAPS_LINE.test(t)) return false;
  const letters = t.replace(/[^A-Z]/g, "").length;
  return letters >= 2;
}

/**
 * Convert a Fountain document into paragraph nodes.
 * Handles scene headings, transitions, characters, dialogue, parentheticals,
 * lyrics, centered lines and page breaks.
 */
export function parseFountain(fountain: string): ScriptNode[] {
  const lines = fountain.replace(/\r\n/g, "\n").split("\n");
  const nodes: ScriptNode[] = [];

  let i = 0;
  const flushPendables = () => {
    /* (no-op anchor) */
  };
  void flushPendables;

  const push = (element: ScriptElement, text: string) => {
    nodes.push(makeNode(element, text));
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    i += 1;

    if (!line) continue;
    if (/^={3,}$/.test(line)) continue;

    /* Lyric */
    if (LYRIC_PREFIX.test(line)) {
      push(ScriptElement.Lyrics, line.slice(1).trim());
      continue;
    }

    /* Our own dialogue marker */
    if (DIALOGUE_MARK.test(line)) {
      push(ScriptElement.Dialogue, line.slice(1).trim());
      continue;
    }

    /* Centered: > ... < */
    if (line.length >= 3 && line.startsWith(">") && line.endsWith("<")) {
      push(ScriptElement.Centered, line.slice(1, -1).trim());
      continue;
    }

    /* Scene heading */
    if (SCENE_REGEX.test(line)) {
      push(ScriptElement.SceneHeading, cleanHeading(line));
      continue;
    }

    /* Transition */
    if (line.endsWith(">") || TRANSITION_LABELS.test(line)) {
      push(ScriptElement.Transition, line.replace(/>$/, "").trim());
      continue;
    }

    /* Shot (our export emits `>`-prefixed, non-closed lines) */
    if (line.startsWith(">") && !line.endsWith("<")) {
      push(ScriptElement.Shot, line.replace(/^>/, "").trim());
      continue;
    }

    /* Parenthetical on its own line */
    if (/^\([^()]*\)$/.test(line) && /\(.+\)/.test(line)) {
      push(ScriptElement.Parenthetical, line);
      continue;
    }

    /* Character cue */
    if (looksLikeCharacter(line)) {
      let text = line;
      const ext = text.match(/^(.+)\(([^)]*)\)$/);
      if (ext) text = `${ext[1].trim()}, ${ext[2].trim()}`;
      push(ScriptElement.Character, text);
      continue;
    }

    /* Otherwise it is narration/action */
    push(ScriptElement.Action, line);
  }

  return nodes;
}

function cleanHeading(line: string): string {
  return line.trim().replace(/\s{2,}/g, " ").replace(/\.$/, "") || line;
}

export function fountainRoundTrip(nodes: ScriptNode[]): ScriptNode[] {
  return nodes;
}