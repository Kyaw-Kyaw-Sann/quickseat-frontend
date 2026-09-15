import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { QuickSeatLogo } from "@/components/layout/quickseat-logo";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/cinemas", label: "Cinemas" },
  { href: "/showtimes", label: "Showtimes" },
];

const accountLinks = [
  { href: "/login", label: "Sign In" },
  { href: "/register", label: "Sign Up" },
  { href: "/bookings", label: "My Bookings" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[radial-gradient(ellipse_at_20%_100%,rgba(103,15,30,0.28),transparent_45%),var(--qs-background)]">
      <PageContainer className="py-10 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[minmax(12rem,1.35fr)_repeat(2,minmax(8rem,0.75fr))_minmax(13rem,1fr)]">
          <div className="min-w-0">
            <QuickSeatLogo />
            <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--qs-text-muted)]">
              More than movies. A better way to book your next cinema visit.
            </p>
          </div>

          <FooterLinkGroup heading="Explore" links={footerLinks} />
          <FooterLinkGroup heading="Account" links={accountLinks} />

          <div className="border-t border-white/10 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--qs-text-muted)]">
              QuickSeat
            </p>
            <p className="mt-3 max-w-[14rem] text-lg leading-7 text-[var(--qs-text)]">
              Good movies bring people together.
            </p>
            <span className="mt-5 block h-0.5 w-9 rounded-full bg-[var(--qs-primary)] shadow-[0_0_10px_rgba(255,31,66,0.85)]" />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-[var(--qs-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} QuickSeat. All rights reserved.</p>
          <p>Discover. Reserve. Enjoy the show.</p>
        </div>
      </PageContainer>
    </footer>
  );
}

function FooterLinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={`${heading} links`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--qs-text-muted)]">
        {heading}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="text-[var(--qs-text-muted)] transition-colors hover:text-[var(--qs-text)] focus-visible:text-[var(--qs-text)]"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
