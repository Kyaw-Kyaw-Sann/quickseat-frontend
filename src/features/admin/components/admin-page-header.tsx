import Link from "next/link";
import type { ReactNode } from "react";

export type AdminBreadcrumb = {
  label: string;
  href?: string;
};

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: readonly AdminBreadcrumb[];
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="border-b border-[var(--qs-border)] pb-5">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-[var(--qs-text-muted)]">
            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li className="flex items-center gap-2" key={`${breadcrumb.label}-${index}`}>
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {breadcrumb.href && !isLast ? (
                    <Link className="rounded hover:text-[var(--qs-text)]" href={breadcrumb.href}>
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined}>{breadcrumb.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--qs-text)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-[var(--qs-text-muted)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
