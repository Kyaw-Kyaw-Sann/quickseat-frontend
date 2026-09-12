import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import type { ReactNode } from "react";

type AuthFormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthFormShell({
  title,
  description,
  children,
  footer,
}: AuthFormShellProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden py-12 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,#54111f_0%,transparent_68%)] opacity-70"
      />
      <PageContainer className="grid min-h-[calc(100vh-6rem)] place-items-center">
        <Card className="w-full max-w-md border-[#4a2630] p-6 sm:p-8">
          <header className="mb-7 space-y-3">
            <Badge tone="primary">SECURE ACCESS</Badge>
            <h1 className="qs-heading">{title}</h1>
            <p className="text-sm text-[var(--qs-text-muted)]">{description}</p>
          </header>
          {children}
          {footer ? (
            <footer className="mt-6 border-t border-[var(--qs-border)] pt-5 text-center text-sm text-[var(--qs-text-muted)]">
              {footer}
            </footer>
          ) : null}
        </Card>
      </PageContainer>
    </main>
  );
}
