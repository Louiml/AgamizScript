import type { ScriptNode } from "@/types/script";
import { ScriptElement, detectDirection } from "@/types/script";
import { uid } from "@/utils/cn";

const FDX_TO_ELEMENT: Record<string, ScriptElement> = {
  "Scene Heading": ScriptElement.SceneHeading,
  Action: ScriptElement.Action,
  Character: ScriptElement.Character,
  Dialogue: ScriptElement.Dialogue,
  Parenthetical: ScriptElement.Parenthetical,
  Transition: ScriptElement.Transition,
  Shot: ScriptElement.Shot,
  Song: ScriptElement.Lyrics,
  General: ScriptElement.Centered,
  "Page Break": ScriptElement.PageBreak,
  Note: ScriptElement.Null,
};

/**
 * Parse a Final Draft `.fdx` XML document into paragraph nodes.
 * Uses the browser DOMParser (webview runtime).
 */
export function parseFdx(xml: string): ScriptNode[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const nodes: ScriptNode[] = [];
  const paragraphs = doc.getElementsByTagName("Paragraph");

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs.item(i);
    if (!para) continue;

    const type = para.getAttribute("Type") ?? "Action";
    const element = FDX_TO_ELEMENT[type] ?? ScriptElement.Action;

    const textEl = para.getElementsByTagName("Text")[0];
    const text = textEl?.textContent ?? "";

    if (element === ScriptElement.PageBreak) continue;
    nodes.push({
      id: uid(),
      element,
      text,
      direction: detectDirection(text),
    });
  }
  return nodes;
}