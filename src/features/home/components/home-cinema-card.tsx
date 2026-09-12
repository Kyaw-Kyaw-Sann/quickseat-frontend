import Link from "next/link";
import type { Cinema } from "@/features/cinemas/types";
import { Artwork } from "@/features/home/components/artwork";

type HomeCinemaCardProps = {
  cinema: Cinema;
};

export function HomeCinemaCard({ cinema }: HomeCinemaCardProps) {
  return (
    <article className="group relative min-h-56 overflow-hidden rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] shadow-[0_20px_55px_rgba(0,0,0,0.3)]">
      <Artwork
        alt={`${cinema.name} cinema`}
        className="transition duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
        src={cinema.imageUrl}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-lg font-bold text-white">{cinema.name}</h3>
        <p className="mt-1 text-sm text-white/75">{cinema.city}</p>
        <p className="mt-1 line-clamp-1 text-xs text-white/60">{cinema.address}</p>
        <Link
          className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-white/30 bg-black/35 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[var(--qs-primary)] hover:bg-[rgba(255,39,69,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qs-primary)]"
          href={`/cinemas/${cinema.id}`}
        >
          View Cinema <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>
    </article>
  );
}
