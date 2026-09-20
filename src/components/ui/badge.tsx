import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[#29292f] text-[#d4d4d8]",
  primary: "bg-[#3a171d] text-[#ff8999]",
  success: "bg-[#163124] text-[#78d89b]",
  warning: "bg-[#352814] text-[#edbd68]",
  danger: "bg-[#3a191b] text-[#f58d8d]",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
