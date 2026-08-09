import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

export interface CtxItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface CtxState {
  x: number;
  y: number;
  items: CtxItem[];
}

/**
 * Reusable right-click menu. Attach `openContextMenu(e, items)` to any
 * element's `onContextMenu` and render `{ctxMenu}` once per screen.
 */
export function useContextMenu() {
  const [menu, setMenu] = useState<CtxState | null>(null);

  const open = (e: React.MouseEvent, items: CtxItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    const width = 200;
    const height = Math.min(300, items.length * 34 + 12);
    setMenu({
      x: Math.min(e.clientX, window.innerWidth - width - 8),
      y: Math.min(e.clientY, window.innerHeight - height - 8),
      items,
    });
  };

  const close = () => setMenu(null);

  return {
    ctxMenu: menu ? <ContextMenu state={menu} onClose={close} /> : null,
    openContextMenu: open,
    closeContextMenu: close,
  };
}

function ContextMenu({ state, onClose }: { state: CtxState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y, items } = state;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onMenu = (_e: MouseEvent) => onClose();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onMenu);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onMenu);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[100] min-w-44 max-w-64 rounded-xl border border-line bg-surface-raised p-1 shadow-glass"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) =>
        it.label === "" ? (
          <div key={i} className="mx-2 my-1 h-px bg-line" />
        ) : (
          <button
            key={i}
            disabled={it.disabled}
            onClick={() => {
              onClose();
              it.onSelect();
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink transition-colors hover:bg-surface-muted",
              it.danger && "text-red-400 hover:bg-red-500/10",
              it.disabled && "pointer-events-none opacity-40",
            )}
          >
            {it.icon && <span className="text-ink-muted">{it.icon}</span>}
            <span className="truncate">{it.label}</span>
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}