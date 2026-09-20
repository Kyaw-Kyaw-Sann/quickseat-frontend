import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-5",
        className,
      )}
      {...props}
    />
  );
}
