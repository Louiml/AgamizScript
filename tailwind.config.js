import type { Config } from "tailwindcss";

const palette = {
  accent: {
    DEFAULT: "rgb(var(--as-accent) / <alpha-value>)",
    soft: "rgb(var(--as-accent-soft) / <alpha-value>)",
  },
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "rgb(var(--as-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--as-surface-raised) / <alpha-value>)",
        "surface-muted": "rgb(var(--as-surface-muted) / <alpha-value>)",
        line: "rgb(var(--as-line) / <alpha-value>)",
        ink: "rgb(var(--as-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--as-ink-muted) / <alpha-value>)",
        ...palette,
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Noto Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
        script: ["var(--script-font)", "Courier Prime", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 40px -8px rgb(0 0 0 / 0.18)",
        card: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -12px rgb(0 0 0 / 0.14)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;