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
      <span className="relative block h-10 w-14 shrink-0 overflow-hidden drop-shadow-[0_0_15px_rgba(255,31,66,0.38)]">
        <Image
          alt=""
          className="h-full w-full object-contain"
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
