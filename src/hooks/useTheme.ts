import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

function resolveTheme(mode: "system" | "light" | "dark"): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Keep the CSS surface/ink variables in sync with theme + accent. */
export function useTheme() {
  const theme = useAppStore((s) => s.theme);
  const accent = useAppStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = resolveTheme(theme);
    root.classList.toggle("light", resolved === "light");
    root.classList.toggle("dark", resolved === "dark");

    const [r, g, b] = parseHex(accent);
    root.style.setProperty("--as-accent", `${r} ${g} ${b}`);
    root.style.setProperty(
      "--as-accent-soft",
      `${Math.round(r * 0.5)} ${Math.round(g * 0.5)} ${Math.round(b * 0.5)}`,
    );
  }, [theme, accent]);
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  if (m.length === 3) {
    const r = parseInt(m[0] + m[0], 16);
    const g = parseInt(m[1] + m[1], 16);
    const b = parseInt(m[2] + m[2], 16);
    return [r, g, b];
  }
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return [Number.isNaN(r) ? 99 : r, Number.isNaN(g) ? 102 : g, Number.isNaN(b) ? 241 : b];
}