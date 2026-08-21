import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-ink)] text-[var(--color-cream)] hover:bg-[var(--color-ink-soft)]",
  secondary:
    "border border-[var(--color-gold)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-gold-soft)]",
  ghost: "bg-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
  danger: "bg-red-800 text-white hover:bg-red-900",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
