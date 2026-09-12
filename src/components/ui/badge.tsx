import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-[#4a4a54] bg-[#27272d] text-[#d4d4d8]",
  primary: "border-[#ff5269] bg-[#3b1119] text-[#ff9aa8]",
  success: "border-[#4cbd79] bg-[#102b1b] text-[#82e6a7]",
  warning: "border-[#d99c37] bg-[#33230d] text-[#f8c86f]",
  danger: "border-[#e65d5d] bg-[#351112] text-[#ff9999]",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
