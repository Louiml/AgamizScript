import { Node, mergeAttributes } from "@tiptap/core";
import type { Direction, RevisionColor } from "@/types/script";
import { ScriptElement } from "@/types/script";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    scriptElement: {
      /** Set the screenplay element of the current paragraph (or all blocks in selection). */
      setElement: (element: ScriptElement | null) => ReturnType;
      /** Set the text direction of the current block. */
      setDirection: (direction: Direction) => ReturnType;
      /** Apply a revision color to the current block. */
      setRevision: (color: RevisionColor | null) => ReturnType;
    };
  }
}

const DEFAULT_ELEMENT = ScriptElement.Action;

const FLOW_ORDER = [
  ScriptElement.SceneHeading,
  ScriptElement.Action,
  ScriptElement.Character,
  ScriptElement.Dialogue,
  ScriptElement.Parenthetical,
  ScriptElement.Transition,
  ScriptElement.Shot,
];

function nextElement(current: ScriptElement): ScriptElement {
  const i = FLOW_ORDER.indexOf(current);
  return FLOW_ORDER[(i + 1) % FLOW_ORDER.length];
}

function prevElement(current: ScriptElement): ScriptElement {
  const i = FLOW_ORDER.indexOf(current);
  return FLOW_ORDER[(i - 1 + FLOW_ORDER.length) % FLOW_ORDER.length];
}

/** Natural follow-up when <Enter> is pressed on an empty block. */
function enterFlow(current: ScriptElement): ScriptElement {
  switch (current) {
    case ScriptElement.SceneHeading:
      return ScriptElement.Action;
    case ScriptElement.Character:
      return ScriptElement.Dialogue;
    case ScriptElement.Action:
      return ScriptElement.Character;
    case ScriptElement.Dialogue:
      return ScriptElement.Action;
    case ScriptElement.Parenthetical:
      return ScriptElement.Dialogue;
    case ScriptElement.Transition:
    case ScriptElement.Shot:
      return ScriptElement.SceneHeading;
    default:
      return current;
  }
}

/**
 * Paragraph-block carrying screenplay element semantics.
 * Element type lives as an attribute so switching is cheap and undoable.
 */
export const ScriptElementNode = Node.create({
  name: "scriptElement",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      element: {
        default: DEFAULT_ELEMENT,
        parseHTML: (el) => (el.getAttribute("data-element") ?? DEFAULT_ELEMENT) as ScriptElement,
        renderHTML: (attrs) => ({ "data-element": attrs.element }),
      },
      direction: {
        default: "ltr",
        parseHTML: (el) => el.getAttribute("dir") ?? "ltr",
        renderHTML: (attrs) => (attrs.direction === "rtl" ? { dir: "rtl" } : {}),
      },
      revision: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-revision"),
        renderHTML: (attrs) =>
          attrs.revision
            ? { "data-revision": attrs.revision, class: `revision-${attrs.revision}` }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      { tag: "p[data-element]" },
      { tag: "div[data-element]" },
      { tag: "p" },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const element = (HTMLAttributes.element as ScriptElement) ?? node.attrs.element;
    return ["div", mergeAttributes(HTMLAttributes, { "data-element": element }), 0];
  },

  addCommands() {
    return {
      setElement:
        (element) =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos, parent) => {
            if (parent && node.type === this.type) {
              if (dispatch && node.attrs.element !== element) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, element });
                changed = true;
              }
              return false;
            }
            return true;
          });
          return changed;
        },
      setDirection:
        (direction) =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos, parent) => {
            if (parent && node.type === this.type) {
              if (dispatch && node.attrs.direction !== direction) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, direction });
                changed = true;
              }
              return false;
            }
            return true;
          });
          return changed;
        },
      setRevision:
        (color) =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type === this.type) {
              if (dispatch && node.attrs.revision !== color) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, revision: color });
                changed = true;
              }
              return false;
            }
            return true;
          });
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { state } = this.editor;
        const el = state.selection.$from.parent.attrs.element as ScriptElement;
        if (!el) return false;
        this.editor.view.dispatch(
          state.tr.setNodeMarkup(
            state.selection.$from.before(state.selection.$from.depth),
            undefined,
            { element: nextElement(el) },
          ),
        );
        return true;
      },
      "Shift-Tab": () => {
        const { state } = this.editor;
        const el = state.selection.$from.parent.attrs.element as ScriptElement;
        if (!el) return false;
        this.editor.view.dispatch(
          state.tr.setNodeMarkup(
            state.selection.$from.before(state.selection.$from.depth),
            undefined,
            { element: prevElement(el) },
          ),
        );
        return true;
      },
      Enter: () => {
        const { state } = this.editor;
        if (!state.selection.empty) return false;
        const $from = state.selection.$from;
        // Only intercept Enter on an empty paragraph — otherwise use default split.
        if ($from.parent.textContent !== "" || $from.parent.childCount !== 0) return false;
        const el = $from.parent.attrs.element as ScriptElement;
        const next = enterFlow(el);
        if (!next || next === el) return false;
        this.editor.view.dispatch(
          state.tr.setNodeMarkup($from.before($from.depth), undefined, { element: next }),
        );
        return true;
      },
      "Mod-Enter": () => false,
    };
  },
});

/* ------------------------------------------------------------------ */
/* Editor-facing helpers used by the toolbar & keyboard handlers       */
/* ------------------------------------------------------------------ */

export { nextElement as nextScriptElement, prevElement as prevScriptElement };