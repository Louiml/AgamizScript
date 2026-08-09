import { cn } from "@/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function buttonClass(
  variant: "primary" | "ghost" | "subtle" | "danger" = "ghost",
): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50",
    variant === "primary" && "bg-accent text-white shadow-card hover:opacity-90",
    variant === "ghost" && "border border-line bg-surface/60 text-ink hover:border-accent/40",
    variant === "subtle" && "text-ink-muted hover:bg-surface-muted hover:text-ink",
    variant === "danger" && "border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20",
  );
}

export function Button({
  className,
  variant = "ghost",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "subtle" | "danger" }) {
  return (
    <button className={cn(buttonClass(variant), className)} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent/50";

export function Select({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className={cn(inputClass, "appearance-none", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}