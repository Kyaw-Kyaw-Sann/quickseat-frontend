import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { QuickSeatLogo } from "@/components/layout/quickseat-logo";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/cinemas", label: "Cinemas" },
  { href: "/showtimes", label: "Showtimes" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--qs-border)] bg-[var(--qs-bg)]">
      <PageContainer className="grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <QuickSeatLogo />
          <p className="mt-3 max-w-xs text-sm text-[var(--qs-text-muted)]">
            More than movies. A better way to book your next cinema visit.
          </p>
          <p className="mt-6 text-xs text-[var(--qs-text-muted)]">
            © {new Date().getFullYear()} QuickSeat. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            {footerLinks.map((link) => (
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
      </PageContainer>
    </footer>
  );
}
