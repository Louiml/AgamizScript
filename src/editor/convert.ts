import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { ScriptElement, type ScriptNode } from "@/types/script";
import { uid } from "@/utils/cn";

/**
 * Snapshot the current ProseMirror doc into Agamiz `ScriptNode`s.
 */
export function editorToNodes(editor: Editor): ScriptNode[] {
  const nodes: ScriptNode[] = [];
  editor.state.doc.forEach((block) => {
    if (block.type.name !== "scriptElement") return;
    nodes.push({
      id: uid(),
      element: block.attrs.element as ScriptNode["element"],
      text: block.textContent,
      direction: (block.attrs.direction as ScriptNode["direction"]) ?? "ltr",
      revision: (block.attrs.revision as ScriptNode["revision"]) ?? undefined,
    });
  });
  return nodes;
}

/** Build a Tiptap JSON document from script nodes (hydration). */
export function nodesToDoc(nodes: ScriptNode[]): JSONContent {
  return {
    type: "doc",
    content: nodes.map((n) => ({
      type: "scriptElement",
      attrs: {
        element: n.element,
        direction: n.direction ?? "ltr",
        revision: n.revision ?? null,
      },
      content: buildInlineContent(n.text ?? ""),
    })),
  };
}

function buildInlineContent(text: string): JSONContent[] {
  const parts = text.split("\n");
  const content: JSONContent[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length > 0) {
      content.push({ type: "text", text: parts[i] });
    }
    if (i < parts.length - 1) {
      content.push({ type: "hardBreak" });
    }
  }
  return content.length > 0 ? content : [{ type: "text", text: "" }];
}

/** Extract scene headings for the outline panel. */
export function outlineFromNodes(nodes: ScriptNode[]): { element: string; text: string }[] {
  return nodes
    .filter((n) => n.element === ScriptElement.SceneHeading)
    .map((n) => ({ element: n.text, text: n.text }));
}