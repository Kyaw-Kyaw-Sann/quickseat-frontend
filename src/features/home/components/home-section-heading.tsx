import Link from "next/link";

type HomeSectionHeadingProps = {
  description: string;
  headingId: string;
  href: string;
  linkLabel: string;
  title: string;
};

export function HomeSectionHeading({
  description,
  headingId,
  href,
  linkLabel,
  title,
}: HomeSectionHeadingProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2
          className="border-l-4 border-[var(--qs-primary)] pl-3 text-2xl font-bold tracking-tight sm:text-3xl"
          id={headingId}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{description}</p>
      </div>
      <Link
        className="shrink-0 text-sm font-semibold text-[var(--qs-primary)] transition-colors hover:text-[#ff7186]"
        href={href}
      >
        {linkLabel} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
