import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.2)] sm:p-5",
        className,
      )}
      {...props}
    />
  );
}
