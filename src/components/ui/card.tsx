import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)]",
        className,
      )}
      {...props}
    />
  );
}
