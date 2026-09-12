"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { useState } from "react";

const colors = [
  ["Background", "var(--qs-background)"],
  ["Surface", "var(--qs-surface)"],
  ["Primary", "var(--qs-primary)"],
  ["Amber", "var(--qs-amber)"],
  ["Success", "var(--qs-success)"],
  ["Danger", "var(--qs-danger)"],
];

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main>
      <PageContainer>
        <Section className="space-y-12">
          <header className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold tracking-[0.24em] text-[var(--qs-primary)]">
              QUICKSEAT FOUNDATION
            </p>
            <h1 className="qs-display">
              A cinematic system for clear booking moments.
            </h1>
            <p className="max-w-2xl text-lg text-[var(--qs-text-muted)]">
              Reusable, accessible primitives for the QuickSeat customer
              experience.
            </p>
          </header>

          <PreviewSection title="Color">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {colors.map(([name, value]) => (
                <Card className="p-3" key={name}>
                  <div
                    aria-label={`${name} color`}
                    className="h-14 rounded-md border border-white/10"
                    style={{ background: value }}
                  />
                  <p className="mt-3 text-sm font-semibold">{name}</p>
                </Card>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection title="Typography">
            <Card className="space-y-5">
              <p className="qs-display text-[clamp(2.2rem,5vw,4.5rem)]">
                More than a movie.
              </p>
              <h2 className="qs-heading">Designed for booking confidence</h2>
              <p className="max-w-2xl text-[var(--qs-text-muted)]">
                Clear hierarchy, restrained contrast, and readable content are
                the foundation for every future customer screen.
              </p>
            </Card>
          </PreviewSection>

          <PreviewSection title="Buttons and badges">
            <Card className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary action</Button>
                <Button variant="ghost">Ghost action</Button>
                <Button variant="danger">Danger action</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">NOW SHOWING</Badge>
                <Badge tone="success">SUCCESS</Badge>
                <Badge tone="warning">PENDING</Badge>
                <Badge tone="danger">CANCELLED</Badge>
                <StatusBadge status="CONFIRMED" />
                <StatusBadge status="HELD" />
              </div>
            </Card>
          </PreviewSection>

          <PreviewSection title="Inputs and select">
            <Card className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium" htmlFor="preview-search">
                Default input
                <Input id="preview-search" placeholder="Search a movie" />
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="preview-select">
                Select field
                <Select defaultValue="" id="preview-select">
                  <option disabled value="">
                    Choose an option
                  </option>
                  <option>Now showing</option>
                  <option>Upcoming</option>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="preview-error">
                Error input
                <Input
                  error="Please enter a valid value."
                  id="preview-error"
                  value=""
                  onChange={() => undefined}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="preview-disabled">
                Disabled input
                <Input disabled id="preview-disabled" value="Unavailable" readOnly />
              </label>
            </Card>
          </PreviewSection>

          <PreviewSection title="Cards and feedback states">
            <div className="grid gap-5 lg:grid-cols-3">
              <Card>
                <p className="text-sm font-semibold">Card title</p>
                <p className="mt-2 text-sm text-[var(--qs-text-muted)]">
                  A quiet surface for content, filters, and future booking
                  details.
                </p>
              </Card>
              <EmptyState
                description="Adjust your filters or try again later."
                title="Nothing here yet"
              />
              <ErrorState
                action={<Button variant="secondary">Try again</Button>}
                description="We could not load this content right now."
                title="Something needs attention"
              />
            </div>
          </PreviewSection>

          <PreviewSection title="Skeleton and dialog">
            <Card className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
            </Card>
          </PreviewSection>
        </Section>
      </PageContainer>

      <Dialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="Dialog foundation"
      >
        <div className="space-y-5">
          <p className="text-sm text-[var(--qs-text-muted)]">
            This accessible native dialog is ready for future confirmation and
            information flows.
          </p>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setDialogOpen(false)} variant="secondary">
              Close
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
          </div>
        </div>
      </Dialog>
    </main>
  );
}

function PreviewSection({
  children,
  title,
}: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <section className="space-y-4">
      <h2 className="qs-heading text-2xl">{title}</h2>
      {children}
    </section>
  );
}
