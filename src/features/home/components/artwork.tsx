"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type ArtworkProps = {
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
  src: string | null;
};

export function Artwork({ alt, className, priority, sizes, src }: ArtworkProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-label={`${alt} artwork unavailable`}
        className={cn(
          "grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_25%,#39111a_0%,#17171b_48%,#0c0c0e_100%)] px-6 text-center text-sm text-[var(--qs-text-muted)]",
          className,
        )}
        role="img"
      >
        {alt}
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={cn("object-cover", className)}
      fill
      onError={() => setFailed(true)}
      priority={priority}
      sizes={sizes}
      src={src}
      unoptimized
    />
  );
}
