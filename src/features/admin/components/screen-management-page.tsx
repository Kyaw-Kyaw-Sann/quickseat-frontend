"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { ScreenFormDialog } from "@/features/admin/components/screen-form-dialog";
import { StatusConfirmationDialog } from "@/features/admin/components/status-confirmation-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCinema, AdminScreen, AdminScreenInput } from "@/features/admin/types";
import {
  createAdminScreen,
  getAdminCinema,
  getAdminScreens,
  updateAdminScreen,
  updateAdminScreenStatus,
} from "@/lib/api/admin-cinema-management";
import type { FieldErrors } from "@/lib/api/types";

export function ScreenManagementPage({ cinemaId }: { cinemaId: number }) {
  const [cinema, setCinema] = useState<AdminCinema | null>(null);
  const [screens, setScreens] = useState<AdminScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formScreen, setFormScreen] = useState<AdminScreen | null>(null);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusTarget, setStatusTarget] = useState<AdminScreen | null>(null);
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cinemaResponse, screensResponse] = await Promise.all([
        getAdminCinema(cinemaId),
        getAdminScreens(cinemaId),
      ]);
      setCinema(cinemaResponse.data);
      setScreens(screensResponse.data);
    } catch (error) {
      setLoadError(getAdminMutationError(error).message);
    } finally {
      setLoading(false);
    }
  }, [cinemaId]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  async function submit(input: AdminScreenInput) {
    if (pending) return;
    setPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = formScreen
        ? await updateAdminScreen(formScreen.id, input)
        : await createAdminScreen(cinemaId, input);
      setFormOpen(false);
      setSuccessMessage(response.message);
      await load();
    } catch (error) {
      const normalized = getAdminMutationError(error);
      setMutationError(normalized.message);
      setFieldErrors(normalized.fieldErrors);
    } finally {
      setPending(false);
    }
  }

  async function confirmStatus() {
    if (!statusTarget || pending) return;
    setPending(true);
    setStatusError("");
    try {
      const response = await updateAdminScreenStatus(statusTarget.id, { active: !statusTarget.active });
      setStatusTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (error) {
      setStatusError(getAdminMutationError(error).message);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <ScreenPageSkeleton />;
  if (loadError || !cinema) {
    return <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError || "Cinema context is unavailable."} title="Unable to load screens" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={<Button disabled={!cinema.active} onClick={() => { setFormScreen(null); setMutationError(""); setFieldErrors({}); setFormOpen(true); }}>Create screen</Button>}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Cinemas", href: "/admin/cinemas" }, { label: cinema.name }]}
        description={`Manage screens within ${cinema.name}.`}
        title="Screens"
      />

      {!cinema.active ? <AdminNotice message="This cinema is inactive. New screens are disabled until the cinema is active again." /> : null}
      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}

      <Card className="flex flex-col gap-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{cinema.name}</p>
          <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{cinema.city}{cinema.address ? ` · ${cinema.address}` : ""}</p>
        </div>
        {cinema.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}
      </Card>

      {screens.length === 0 ? (
        <EmptyState description="Create the first screen for this cinema when the cinema is active." title="No screens yet" />
      ) : (
        <Card className="overflow-hidden p-0 shadow-none">
          <div aria-label="Scrollable screen table" className="overflow-x-auto" role="region" tabIndex={0}>
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]">
                <tr><th className="px-4 py-3">Screen</th><th className="px-4 py-3">Cinema</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--qs-border)]">
                {screens.map((screen) => (
                  <tr key={screen.id}>
                    <td className="px-4 py-4"><p className="font-semibold">{screen.name}</p><p className="text-xs text-[var(--qs-text-muted)]">ID {screen.id}</p></td>
                    <td className="px-4 py-4 text-[var(--qs-text-muted)]">{cinema.name}</td>
                    <td className="px-4 py-4">{screen.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}</td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2">
                      <Link className="inline-flex min-h-10 items-center rounded-lg border border-[var(--qs-border)] px-3 text-xs font-semibold hover:bg-white/5" href={`/admin/cinemas/${cinemaId}/screens/${screen.id}/seats`}>Seats</Link>
                      <Button className="min-h-10 px-3 text-xs" onClick={() => { setFormScreen(screen); setMutationError(""); setFieldErrors({}); setFormOpen(true); }} variant="ghost">Edit</Button>
                      <Button className="min-h-10 px-3 text-xs" onClick={() => { setStatusError(""); setStatusTarget(screen); }} variant={screen.active ? "danger" : "secondary"}>{screen.active ? "Deactivate" : "Activate"}</Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {formOpen ? <ScreenFormDialog error={mutationError} fieldErrors={fieldErrors} onClose={() => setFormOpen(false)} onSubmit={submit} open pending={pending} screen={formScreen} /> : null}
      <StatusConfirmationDialog active={statusTarget?.active ?? false} entityLabel="Screen" error={statusError} onClose={() => !pending && setStatusTarget(null)} onConfirm={() => void confirmStatus()} open={Boolean(statusTarget)} pending={pending} />
    </div>
  );
}

function ScreenPageSkeleton() {
  return <div aria-label="Loading screens" className="space-y-5"><Skeleton className="h-28 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></div>;
}
