import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--qs-primary)] bg-[var(--qs-primary)] text-white hover:border-[var(--qs-primary-strong)] hover:bg-[var(--qs-primary-strong)]",
  secondary:
    "border-[var(--qs-border)] bg-[var(--qs-surface-raised)] text-[var(--qs-text)] hover:border-[#565661] hover:bg-[#2a2a31]",
  ghost:
    "border-transparent bg-transparent text-[var(--qs-text-muted)] hover:bg-white/5 hover:text-[var(--qs-text)]",
  danger:
    "border-[var(--qs-danger)] bg-transparent text-[#ff8585] hover:bg-[var(--qs-danger)] hover:text-white",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 max-w-full touch-manipulation items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
