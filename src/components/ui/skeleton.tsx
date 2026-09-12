import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef } from "react";

type SkeletonProps = ComponentPropsWithoutRef<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={cn("rounded-md bg-[#29292f]", className)}
      {...props}
    />
  );
}
