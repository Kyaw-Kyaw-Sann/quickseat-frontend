import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type SectionProps = ComponentPropsWithoutRef<"section">;

export function Section({ className, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-[var(--qs-section-space)]", className)}
      {...props}
    />
  );
}
