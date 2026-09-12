import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type QuickSeatLogoProps = {
  className?: string;
};

export function QuickSeatLogo({ className }: QuickSeatLogoProps) {
  return (
    <Link
      aria-label="QuickSeat home"
      className={cn("inline-flex items-center gap-2.5", className)}
      href="/"
    >
      <span className="relative block h-10 w-12 overflow-hidden rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] shadow-[0_0_24px_rgba(255,31,66,0.2)]">
        <Image
          alt=""
          className="h-full w-full object-cover"
          height={356}
          priority
          src="/logo3.svg"
          width={479}
        />
      </span>
      <span className="text-xl font-bold tracking-tight text-[var(--qs-text)]">
        Quick<span className="text-[var(--qs-primary)]">Seat</span>
      </span>
    </Link>
  );
}
