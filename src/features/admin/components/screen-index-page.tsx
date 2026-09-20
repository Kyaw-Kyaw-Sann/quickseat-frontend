"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LiveFilterForm } from "@/components/ui/live-filter-form";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCinemaPage } from "@/features/admin/types";
import { getAdminCinemas } from "@/lib/api/admin-cinema-management";

const PAGE_SIZE = 20;

export function ScreenIndexPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;
  const [result, setResult] = useState<AdminCinemaPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminCinemas({ search, page, size: PAGE_SIZE });
      setResult(response.data);
    } catch (failure) {
      setError(getAdminMutationError(failure).message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function navigate(nextSearch: string, nextPage: number) {
    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextPage > 0) params.set("page", String(nextPage));
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Screens & Seats" }]}
        description="Choose a cinema to manage its screens and physical seat layouts."
        title="Screens & Seats"
      />
      <LiveFilterForm>
          <label className="sr-only" htmlFor="screen-cinema-search">Cinema search</label><Input className="!min-h-10" defaultValue={search} id="screen-cinema-search" name="search" placeholder="Search cinemas..." type="search" />
      </LiveFilterForm>

      {loading ? <Card className="space-y-3 shadow-none">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-16" key={index} />)}</Card> : error ? (
        <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={error} title="Unable to load cinemas" />
      ) : !result || result.content.length === 0 ? (
        <EmptyState description="No cinemas match the current search." title="No cinemas found" />
      ) : (
        <Card className="space-y-4 shadow-none">
          <ul className="divide-y divide-[var(--qs-border)]">
            {result.content.map((cinema) => (
              <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between" key={cinema.id}>
                <div><p className="font-semibold">{cinema.name}</p><p className="mt-1 text-sm text-[var(--qs-text-muted)]">{cinema.city}</p></div>
                <div className="flex items-center gap-3">
                  {cinema.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}
                  <Link className="inline-flex min-h-10 items-center rounded-lg border border-[var(--qs-border)] px-3 text-sm font-semibold hover:bg-white/5" href={`/admin/cinemas/${cinema.id}/screens`}>Manage screens</Link>
                </div>
              </li>
            ))}
          </ul>
          <AdminPagination itemLabel="cinemas" onPageChange={(nextPage) => navigate(search, nextPage)} page={result.number} totalElements={result.totalElements} totalPages={result.totalPages} />
        </Card>
      )}
    </div>
  );
}
