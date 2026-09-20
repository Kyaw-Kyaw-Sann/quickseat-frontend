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
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { CinemaFormDialog } from "@/features/admin/components/cinema-form-dialog";
import { StatusConfirmationDialog } from "@/features/admin/components/status-confirmation-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCinema, AdminCinemaInput, AdminCinemaPage } from "@/features/admin/types";
import {
  createAdminCinema,
  getAdminCinema,
  getAdminCinemas,
  updateAdminCinema,
  updateAdminCinemaStatus,
} from "@/lib/api/admin-cinema-management";
import type { FieldErrors } from "@/lib/api/types";

const PAGE_SIZE = 20;

export function CinemaManagementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const activeParam = searchParams.get("active");
  const active = activeParam === "true" || activeParam === "false" ? activeParam : "";
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const [result, setResult] = useState<AdminCinemaPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [formCinema, setFormCinema] = useState<AdminCinema | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusTarget, setStatusTarget] = useState<AdminCinema | null>(null);
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await getAdminCinemas({
        search,
        active: active ? active === "true" : undefined,
        page,
        size: PAGE_SIZE,
      });
      setResult(response.data);
    } catch (error) {
      const normalized = getAdminMutationError(error);
      setLoadError(normalized.message);
      setNetworkError(normalized.isNetworkError);
    } finally {
      setLoading(false);
    }
  }, [active, page, search]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function updateUrl(next: { search?: string; active?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = next.search ?? search;
    const nextActive = next.active ?? active;
    const nextPage = next.page ?? page;

    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");
    if (nextActive) params.set("active", nextActive);
    else params.delete("active");
    if (nextPage > 0) params.set("page", String(nextPage));
    else params.delete("page");

    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  async function openEdit(cinemaId: number) {
    if (formLoading) return;
    setFormLoading(true);
    setMutationError("");
    try {
      const response = await getAdminCinema(cinemaId);
      setFormCinema(response.data);
      setFormOpen(true);
    } catch (error) {
      setSuccessMessage("");
      setLoadError(getAdminMutationError(error).message);
    } finally {
      setFormLoading(false);
    }
  }

  async function submitCinema(input: AdminCinemaInput) {
    if (mutationPending) return;
    setMutationPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = formCinema
        ? await updateAdminCinema(formCinema.id, input)
        : await createAdminCinema(input);
      setFormOpen(false);
      setSuccessMessage(response.message);
      await load();
    } catch (error) {
      const normalized = getAdminMutationError(error);
      setMutationError(normalized.message);
      setFieldErrors(normalized.fieldErrors);
    } finally {
      setMutationPending(false);
    }
  }

  async function confirmStatus() {
    if (!statusTarget || mutationPending) return;
    setMutationPending(true);
    setStatusError("");
    try {
      const response = await updateAdminCinemaStatus(statusTarget.id, {
        active: !statusTarget.active,
      });
      setStatusTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (error) {
      setStatusError(getAdminMutationError(error).message);
    } finally {
      setMutationPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button
            onClick={() => {
              setFormCinema(null);
              setMutationError("");
              setFieldErrors({});
              setFormOpen(true);
            }}
          >
            Create cinema
          </Button>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Cinemas" }]}
        description="Create cinemas, maintain their details, and move into screen and seat management."
        title="Cinemas"
      />

      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}

      <LiveFilterForm className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem]">
          <label className="sr-only" htmlFor="admin-cinema-search">Search cinemas</label>
          <Input className="!min-h-10" defaultValue={search} id="admin-cinema-search" name="search" placeholder="Search cinemas..." type="search" />
          <div>
            <label className="sr-only" htmlFor="admin-cinema-active">Status</label>
            <Select className="!min-h-10" defaultValue={active} id="admin-cinema-active" name="active">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
      </LiveFilterForm>

      {loading ? (
        <CinemaTableSkeleton />
      ) : loadError ? (
        <ErrorState
          action={<Button onClick={() => void load()} variant="secondary">Try again</Button>}
          description={loadError}
          title={networkError ? "Unable to reach QuickSeat" : "Unable to load cinemas"}
        />
      ) : !result || result.content.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => updateUrl({ search: "", active: "", page: 0 })} variant="secondary">Clear filters</Button>}
          description="No cinemas match the current backend filters."
          title="No cinemas found"
        />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0 shadow-none">
          <div aria-label="Scrollable cinema table" className="overflow-x-auto" role="region" tabIndex={0}>
            <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
              <thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]">
                <tr>
                  <th className="px-4 py-3" scope="col">Cinema</th>
                  <th className="px-4 py-3" scope="col">Location</th>
                  <th className="px-4 py-3" scope="col">Phone</th>
                  <th className="px-4 py-3" scope="col">Status</th>
                  <th className="px-4 py-3 text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--qs-border)]">
                {result.content.map((cinema) => (
                  <tr className="align-top hover:bg-white/[0.02]" key={cinema.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{cinema.name}</p>
                      <p className="mt-1 text-xs text-[var(--qs-text-muted)]">ID {cinema.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{cinema.city}</p>
                      {cinema.address ? <p className="mt-1 max-w-xs text-xs text-[var(--qs-text-muted)]">{cinema.address}</p> : null}
                    </td>
                    <td className="px-4 py-4 text-[var(--qs-text-muted)]">{cinema.phone || "—"}</td>
                    <td className="px-4 py-4">
                      {cinema.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link className="inline-flex min-h-10 items-center rounded-lg border border-[var(--qs-border)] px-3 text-xs font-semibold hover:bg-white/5" href={`/admin/cinemas/${cinema.id}/screens`}>
                          Screens
                        </Link>
                        <Button className="min-h-10 px-3 text-xs" disabled={formLoading} onClick={() => void openEdit(cinema.id)} variant="ghost">Edit</Button>
                        <Button className="min-h-10 px-3 text-xs" onClick={() => { setStatusError(""); setStatusTarget(cinema); }} variant={cinema.active ? "danger" : "secondary"}>
                          {cinema.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <AdminPagination
              itemLabel="cinemas"
              onPageChange={(nextPage) => updateUrl({ page: nextPage })}
              page={result.number}
              totalElements={result.totalElements}
              totalPages={result.totalPages}
            />
          </div>
        </Card>
      )}

      {formOpen ? (
        <CinemaFormDialog
          cinema={formCinema}
          error={mutationError}
          fieldErrors={fieldErrors}
          onClose={() => setFormOpen(false)}
          onSubmit={submitCinema}
          open
          pending={mutationPending}
        />
      ) : null}
      <StatusConfirmationDialog
        active={statusTarget?.active ?? false}
        entityLabel="Cinema"
        error={statusError}
        onClose={() => !mutationPending && setStatusTarget(null)}
        onConfirm={() => void confirmStatus()}
        open={Boolean(statusTarget)}
        pending={mutationPending}
      />
    </div>
  );
}

function CinemaTableSkeleton() {
  return (
    <Card aria-label="Loading cinemas" className="space-y-3 shadow-none">
      {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-16 w-full" key={index} />)}
    </Card>
  );
}
