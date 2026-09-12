import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type PageContainerProps = ComponentPropsWithoutRef<"div">;

export function PageContainer({
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-[var(--qs-page-padding)]",
        className,
      )}
      {...props}
    />
  );
}
