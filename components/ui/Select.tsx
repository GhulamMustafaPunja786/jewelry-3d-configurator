import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-sm border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-gold)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
