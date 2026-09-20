"use client";

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
import { StaffCinemaDialog } from "@/features/admin/components/staff-cinema-dialog";
import { StaffDetailDialog } from "@/features/admin/components/staff-detail-dialog";
import { StaffFormDialog } from "@/features/admin/components/staff-form-dialog";
import { StatusConfirmationDialog } from "@/features/admin/components/status-confirmation-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCinema } from "@/features/admin/types";
import type { AdminStaff, AdminStaffCreateInput, AdminStaffUpdateInput } from "@/features/admin/user-types";
import { getAdminCinemas } from "@/lib/api/admin-cinema-management";
import {
  createAdminStaff,
  getAdminStaff,
  getAdminStaffMember,
  updateAdminStaff,
  updateAdminStaffActive,
  updateAdminStaffCinema,
} from "@/lib/api/admin-user-management";
import type { FieldErrors, PaginatedResponse } from "@/lib/api/types";

const PAGE_SIZE = 20;

function parseBooleanFilter(value: string | null): "true" | "false" | "" {
  return value === "true" || value === "false" ? value : "";
}

function parsePositiveId(value: string | null): number | undefined {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function StaffManagementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const active = parseBooleanFilter(searchParams.get("active"));
  const cinemaId = parsePositiveId(searchParams.get("cinemaId"));
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const [result, setResult] = useState<PaginatedResponse<AdminStaff> | null>(null);
  const [cinemas, setCinemas] = useState<AdminCinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [detail, setDetail] = useState<AdminStaff | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formStaff, setFormStaff] = useState<AdminStaff | null>(null);
  const [assignmentTarget, setAssignmentTarget] = useState<AdminStaff | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminStaff | null>(null);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [actionError, setActionError] = useState("");
  const [actionFieldErrors, setActionFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNetworkError(false);
    try {
      const response = await getAdminStaff({
        search,
        active: active ? active === "true" : undefined,
        cinemaId,
        page,
        size: PAGE_SIZE,
      });
      setResult(response.data);
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setLoadError(normalized.message);
      setNetworkError(normalized.isNetworkError);
    } finally {
      setLoading(false);
    }
  }, [active, cinemaId, page, search]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const request = window.setTimeout(async () => {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const allCinemas = await loadAllCinemas();
        if (!cancelled) setCinemas(allCinemas);
      } catch (failure) {
        if (!cancelled) setOptionsError(getAdminMutationError(failure).message);
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(request); };
  }, []);

  function updateUrl(next: { search?: string; active?: string; cinemaId?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      search: next.search ?? search,
      active: next.active ?? active,
      cinemaId: next.cinemaId ?? (cinemaId ? String(cinemaId) : ""),
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const nextPage = next.page ?? page;
    if (nextPage > 0) params.set("page", String(nextPage));
    else params.delete("page");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  async function fetchStaff(staffId: number): Promise<AdminStaff | null> {
    if (detailLoading) return null;
    setDetailLoading(true);
    setLoadError("");
    try {
      const response = await getAdminStaffMember(staffId);
      return response.data;
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setLoadError(normalized.message);
      setNetworkError(normalized.isNetworkError);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }

  async function openDetail(staffId: number) {
    const staff = await fetchStaff(staffId);
    if (staff) setDetail(staff);
  }

  async function openEdit(staffId: number) {
    const staff = await fetchStaff(staffId);
    if (!staff) return;
    setFormStaff(staff);
    setMutationError("");
    setFieldErrors({});
    setFormOpen(true);
  }

  async function submitStaff(input: AdminStaffCreateInput | AdminStaffUpdateInput) {
    if (pending) return;
    setPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = formStaff
        ? await updateAdminStaff(formStaff.id, input as AdminStaffUpdateInput)
        : await createAdminStaff(input as AdminStaffCreateInput);
      setFormOpen(false);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setMutationError(normalized.status === 409 ? `Staff account conflict: ${normalized.message}` : normalized.message);
      setFieldErrors(normalized.fieldErrors);
    } finally {
      setPending(false);
    }
  }

  async function confirmStatus() {
    if (!statusTarget || pending) return;
    setPending(true);
    setActionError("");
    try {
      const response = await updateAdminStaffActive(statusTarget.id, { active: !statusTarget.active });
      setStatusTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setActionError(normalized.status === 409 ? `Account status conflict: ${normalized.message}` : normalized.message);
    } finally {
      setPending(false);
    }
  }

  async function confirmAssignment(nextCinemaId: number) {
    if (!assignmentTarget || pending) return;
    setPending(true);
    setActionError("");
    setActionFieldErrors({});
    try {
      const response = await updateAdminStaffCinema(assignmentTarget.id, { cinemaId: nextCinemaId });
      setAssignmentTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setActionError(normalized.status === 409 ? `Cinema assignment conflict: ${normalized.message}` : normalized.message);
      setActionFieldErrors(normalized.fieldErrors);
    } finally {
      setPending(false);
    }
  }

  const activeCinemas = cinemas.filter((cinema) => cinema.active);

  return (
    <div className="space-y-6">
      <AdminPageHeader actions={<Button disabled={optionsLoading || activeCinemas.length === 0} onClick={() => { setFormStaff(null); setMutationError(""); setFieldErrors({}); setFormOpen(true); }}>Create staff</Button>} breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Staff" }]} description="Create staff accounts, maintain profiles, and control each staff member's single cinema assignment." title="Staff" />
      {!optionsLoading && activeCinemas.length === 0 ? <AdminNotice message="An active cinema is required before a staff account can be created or reassigned." /> : null}
      {optionsError ? <AdminNotice message={`Cinema selector data could not be loaded: ${optionsError}`} /> : null}
      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}

      <LiveFilterForm className="grid gap-2 md:grid-cols-3">
        <label className="sr-only" htmlFor="staff-search">Search staff</label><Input className="!min-h-10" defaultValue={search} id="staff-search" name="search" placeholder="Search staff..." type="search" />
        <label className="sr-only" htmlFor="staff-active">Account status</label><Select className="!min-h-10" defaultValue={active} id="staff-active" name="active"><option value="">All account states</option><option value="true">Active</option><option value="false">Inactive</option></Select>
        <label className="sr-only" htmlFor="staff-cinema-filter">Assigned cinema</label><Select className="!min-h-10" defaultValue={cinemaId ?? ""} disabled={optionsLoading} id="staff-cinema-filter" name="cinemaId"><option value="">All cinemas</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}{cinema.active ? "" : " (inactive)"}</option>)}</Select>
      </LiveFilterForm>

      {loading ? <StaffTableSkeleton /> : loadError ? (
        <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError} title={networkError ? "Unable to reach QuickSeat" : "Unable to load staff"} />
      ) : !result || result.content.length === 0 ? (
        <EmptyState action={<Button onClick={() => updateUrl({ search: "", active: "", cinemaId: "", page: 0 })} variant="secondary">Clear filters</Button>} description="No staff accounts match the current backend filters." title="No staff found" />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0 shadow-none"><div aria-label="Scrollable staff table" className="overflow-x-auto" role="region" tabIndex={0}><table className="w-full min-w-[70rem] text-left text-sm"><thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Cinema assignment</th><th className="px-4 py-3">Account</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[var(--qs-border)]">
          {result.content.map((staff) => <tr className="hover:bg-white/[0.02]" key={staff.id}><td className="px-4 py-4"><p className="font-semibold">{staff.name}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">ID {staff.id}</p></td><td className="px-4 py-4 break-all">{staff.email}</td><td className="px-4 py-4"><p>{staff.cinemaName ?? cinemaName(cinemas, staff.cinemaId)}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">Cinema ID {staff.cinemaId}</p></td><td className="px-4 py-4">{staff.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openDetail(staff.id)} variant="ghost">View</Button><Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openEdit(staff.id)} variant="ghost">Edit</Button><Button className="min-h-10 px-3 text-xs" disabled={activeCinemas.length === 0} onClick={() => { setActionError(""); setActionFieldErrors({}); setAssignmentTarget(staff); }} variant="secondary">Assign cinema</Button><Button className="min-h-10 px-3 text-xs" onClick={() => { setActionError(""); setStatusTarget(staff); }} variant={staff.active ? "danger" : "secondary"}>{staff.active ? "Deactivate" : "Activate"}</Button></div></td></tr>)}
        </tbody></table></div><div className="px-4 pb-4"><AdminPagination itemLabel="staff accounts" onPageChange={(nextPage) => updateUrl({ page: nextPage })} page={result.page} totalElements={result.totalElements} totalPages={result.totalPages} /></div></Card>
      )}

      {formOpen ? <StaffFormDialog cinemas={activeCinemas} error={mutationError} fieldErrors={fieldErrors} onClose={() => setFormOpen(false)} onSubmit={submitStaff} pending={pending} staff={formStaff} /> : null}
      {detail ? <StaffDetailDialog onClose={() => setDetail(null)} staff={detail} /> : null}
      {assignmentTarget ? <StaffCinemaDialog cinemas={activeCinemas} error={actionError} fieldErrors={actionFieldErrors} onClose={() => !pending && setAssignmentTarget(null)} onConfirm={confirmAssignment} pending={pending} staff={assignmentTarget} /> : null}
      <StatusConfirmationDialog active={statusTarget?.active ?? false} entityLabel="Staff account" error={actionError} onClose={() => !pending && setStatusTarget(null)} onConfirm={() => void confirmStatus()} open={Boolean(statusTarget)} pending={pending} />
    </div>
  );
}

function StaffTableSkeleton() {
  return <Card aria-label="Loading staff" className="space-y-3 shadow-none">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-20" key={index} />)}</Card>;
}

function cinemaName(cinemas: AdminCinema[], cinemaId: number): string {
  return cinemas.find((cinema) => cinema.id === cinemaId)?.name ?? `Cinema ${cinemaId}`;
}

async function loadAllCinemas(): Promise<AdminCinema[]> {
  const first = await getAdminCinemas({ page: 0, size: PAGE_SIZE });
  const cinemas = [...first.data.content];
  for (let page = 1; page < first.data.totalPages; page += 1) {
    const response = await getAdminCinemas({ page, size: PAGE_SIZE });
    cinemas.push(...response.data.content);
  }
  return cinemas;
}
