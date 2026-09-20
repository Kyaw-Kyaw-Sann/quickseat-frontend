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
import { CustomerDetailDialog } from "@/features/admin/components/customer-detail-dialog";
import { StatusConfirmationDialog } from "@/features/admin/components/status-confirmation-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCustomer } from "@/features/admin/user-types";
import { getAdminCustomer, getAdminCustomers, updateAdminCustomerActive } from "@/lib/api/admin-user-management";
import type { PaginatedResponse } from "@/lib/api/types";

const PAGE_SIZE = 20;

function parseBooleanFilter(value: string | null): "true" | "false" | "" {
  return value === "true" || value === "false" ? value : "";
}

export function CustomerManagementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const active = parseBooleanFilter(searchParams.get("active"));
  const emailVerified = parseBooleanFilter(searchParams.get("emailVerified"));
  const parsedPage = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  const [result, setResult] = useState<PaginatedResponse<AdminCustomer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [detail, setDetail] = useState<AdminCustomer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AdminCustomer | null>(null);
  const [pending, setPending] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNetworkError(false);
    try {
      const response = await getAdminCustomers({
        search,
        active: active ? active === "true" : undefined,
        emailVerified: emailVerified ? emailVerified === "true" : undefined,
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
  }, [active, emailVerified, page, search]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  function updateUrl(next: { search?: string; active?: string; emailVerified?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      search: next.search ?? search,
      active: next.active ?? active,
      emailVerified: next.emailVerified ?? emailVerified,
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

  async function openDetail(customerId: number) {
    if (detailLoading) return;
    setDetailLoading(true);
    setLoadError("");
    try {
      const response = await getAdminCustomer(customerId);
      setDetail(response.data);
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setLoadError(normalized.message);
      setNetworkError(normalized.isNetworkError);
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmStatus() {
    if (!statusTarget || pending) return;
    setPending(true);
    setStatusError("");
    try {
      const response = await updateAdminCustomerActive(statusTarget.id, { active: !statusTarget.active });
      setStatusTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (failure) {
      const normalized = getAdminMutationError(failure);
      setStatusError(normalized.status === 409 ? `Account status conflict: ${normalized.message}` : normalized.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]} description="Review customer accounts, email verification, and operational access state." title="Customers" />
      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}
      <LiveFilterForm className="grid gap-2 md:grid-cols-3">
          <label className="sr-only" htmlFor="customer-search">Search customers</label><Input className="!min-h-10" defaultValue={search} id="customer-search" name="search" placeholder="Search customers..." type="search" />
          <label className="sr-only" htmlFor="customer-active">Account status</label><Select className="!min-h-10" defaultValue={active} id="customer-active" name="active"><option value="">All account states</option><option value="true">Active</option><option value="false">Inactive</option></Select>
          <label className="sr-only" htmlFor="customer-verified">Email verification</label><Select className="!min-h-10" defaultValue={emailVerified} id="customer-verified" name="emailVerified"><option value="">All verification states</option><option value="true">Verified</option><option value="false">Not verified</option></Select>
      </LiveFilterForm>

      {loading ? <TableSkeleton label="customers" /> : loadError ? (
        <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError} title={networkError ? "Unable to reach QuickSeat" : "Unable to load customers"} />
      ) : !result || result.content.length === 0 ? (
        <EmptyState action={<Button onClick={() => updateUrl({ search: "", active: "", emailVerified: "", page: 0 })} variant="secondary">Clear filters</Button>} description="No customers match the current backend filters." title="No customers found" />
      ) : (
        <Card className="space-y-4 overflow-hidden p-0 shadow-none">
          <div aria-label="Scrollable customer table" className="overflow-x-auto" role="region" tabIndex={0}><table className="w-full min-w-[58rem] text-left text-sm"><thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Account</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[var(--qs-border)]">
            {result.content.map((customer) => <tr className="hover:bg-white/[0.02]" key={customer.id}><td className="px-4 py-4"><p className="font-semibold">{customer.name}</p><p className="mt-1 text-xs text-[var(--qs-text-muted)]">ID {customer.id}</p></td><td className="px-4 py-4 break-all">{customer.email}</td><td className="px-4 py-4">{customer.emailVerified ? <Badge tone="success">VERIFIED</Badge> : <Badge tone="warning">NOT VERIFIED</Badge>}</td><td className="px-4 py-4">{customer.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button className="min-h-10 px-3 text-xs" disabled={detailLoading} onClick={() => void openDetail(customer.id)} variant="ghost">View</Button><Button className="min-h-10 px-3 text-xs" onClick={() => { setStatusError(""); setStatusTarget(customer); }} variant={customer.active ? "danger" : "secondary"}>{customer.active ? "Deactivate" : "Activate"}</Button></div></td></tr>)}
          </tbody></table></div>
          <div className="px-4 pb-4"><AdminPagination itemLabel="customers" onPageChange={(nextPage) => updateUrl({ page: nextPage })} page={result.page} totalElements={result.totalElements} totalPages={result.totalPages} /></div>
        </Card>
      )}
      {detail ? <CustomerDetailDialog customer={detail} onClose={() => setDetail(null)} /> : null}
      <StatusConfirmationDialog active={statusTarget?.active ?? false} entityLabel="Customer account" error={statusError} onClose={() => !pending && setStatusTarget(null)} onConfirm={() => void confirmStatus()} open={Boolean(statusTarget)} pending={pending} />
    </div>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return <Card aria-label={`Loading ${label}`} className="space-y-3 shadow-none">{Array.from({ length: 6 }, (_, index) => <Skeleton className="h-20" key={index} />)}</Card>;
}
