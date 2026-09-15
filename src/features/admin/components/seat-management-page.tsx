"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { SeatFormDialog } from "@/features/admin/components/seat-form-dialog";
import { SeatLayoutDialog } from "@/features/admin/components/seat-layout-dialog";
import { StatusConfirmationDialog } from "@/features/admin/components/status-confirmation-dialog";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCinema, AdminScreen, AdminSeat, AdminSeatInput, SeatLayoutInput } from "@/features/admin/types";
import {
  createAdminSeatLayout,
  getAdminCinema,
  getAdminScreens,
  getAdminSeats,
  updateAdminSeat,
  updateAdminSeatStatus,
} from "@/lib/api/admin-cinema-management";
import type { FieldErrors } from "@/lib/api/types";

export function SeatManagementPage({ cinemaId, screenId }: { cinemaId: number; screenId: number }) {
  const [cinema, setCinema] = useState<AdminCinema | null>(null);
  const [screen, setScreen] = useState<AdminScreen | null>(null);
  const [seats, setSeats] = useState<AdminSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [editSeat, setEditSeat] = useState<AdminSeat | null>(null);
  const [pending, setPending] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [statusTarget, setStatusTarget] = useState<AdminSeat | null>(null);
  const [statusError, setStatusError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cinemaResponse, screensResponse, seatsResponse] = await Promise.all([
        getAdminCinema(cinemaId),
        getAdminScreens(cinemaId),
        getAdminSeats(screenId),
      ]);
      const selectedScreen = screensResponse.data.find((item) => item.id === screenId) ?? null;
      if (!selectedScreen) throw new Error("The selected screen does not belong to this cinema.");
      setCinema(cinemaResponse.data);
      setScreen(selectedScreen);
      setSeats(seatsResponse.data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : getAdminMutationError(error).message);
    } finally {
      setLoading(false);
    }
  }, [cinemaId, screenId]);

  useEffect(() => {
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [load]);

  const rows = useMemo(() => {
    const grouped = new Map<string, AdminSeat[]>();
    for (const seat of seats) {
      const row = grouped.get(seat.rowName) ?? [];
      row.push(seat);
      grouped.set(seat.rowName, row);
    }
    return Array.from(grouped.entries());
  }, [seats]);

  async function generateLayout(input: SeatLayoutInput) {
    if (pending) return;
    setPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = await createAdminSeatLayout(screenId, input);
      setLayoutOpen(false);
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

  async function saveSeat(input: AdminSeatInput) {
    if (!editSeat || pending) return;
    setPending(true);
    setMutationError("");
    setFieldErrors({});
    try {
      const response = await updateAdminSeat(editSeat.id, input);
      setEditSeat(null);
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
      const response = await updateAdminSeatStatus(statusTarget.id, { active: !statusTarget.active });
      setStatusTarget(null);
      setSuccessMessage(response.message);
      await load();
    } catch (error) {
      setStatusError(getAdminMutationError(error).message);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <div aria-label="Loading seats" className="space-y-5"><Skeleton className="h-28" /><Skeleton className="h-52" /><Skeleton className="h-72" /></div>;
  if (loadError || !cinema || !screen) return <ErrorState action={<Button onClick={() => void load()} variant="secondary">Try again</Button>} description={loadError || "Seat context is unavailable."} title="Unable to load seats" />;

  const operationalParentActive = cinema.active && screen.active;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={<Button disabled={!operationalParentActive} onClick={() => { setMutationError(""); setFieldErrors({}); setLayoutOpen(true); }}>Generate seat layout</Button>}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Cinemas", href: "/admin/cinemas" }, { label: cinema.name, href: `/admin/cinemas/${cinemaId}/screens` }, { label: screen.name }]}
        description={`Manage physical seats within ${screen.name}.`}
        title="Seats"
      />

      {!operationalParentActive ? <AdminNotice message="New seat layout generation is disabled because the parent cinema or screen is inactive." /> : null}
      {successMessage ? <AdminNotice message={successMessage} tone="success" /> : null}

      <Card className="flex flex-col gap-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{cinema.name} / {screen.name}</p>
          <p className="mt-1 text-sm text-[var(--qs-text-muted)]">{seats.length} physical seat units</p>
        </div>
        <div className="flex gap-2">
          {cinema.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">CINEMA INACTIVE</Badge>}
          {screen.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">SCREEN INACTIVE</Badge>}
        </div>
      </Card>

      {seats.length === 0 ? (
        <EmptyState description="Generate the first row-based physical seat layout for this screen." title="No seats yet" />
      ) : (
        <>
          <Card className="overflow-x-auto shadow-none">
            <div className="min-w-max space-y-3" aria-label="Physical seat layout">
              <div className="mx-auto mb-6 h-2 w-2/3 rounded-full bg-[#555560]" aria-hidden="true" />
              {rows.map(([rowName, rowSeats]) => (
                <div className="flex items-center gap-3" key={rowName}>
                  <span className="w-8 shrink-0 text-sm font-bold text-[var(--qs-text-muted)]">{rowName}</span>
                  <div className="flex gap-2">
                    {rowSeats.map((seat) => (
                      <div
                        aria-label={`Row ${seat.rowName}, seat ${seat.seatNumber}, ${seat.seatType}, ${seat.active ? "active" : "inactive"}`}
                        className={`grid h-10 place-items-center rounded-md border text-xs font-semibold ${seat.seatType === "COUPLE" ? "w-16 border-[var(--qs-warning)] bg-[#31240f]" : "w-10 border-[var(--qs-border)] bg-[#222228]"} ${seat.active ? "" : "opacity-35"}`}
                        key={seat.id}
                      >
                        {seat.seatNumber}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-0 shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="bg-[#1d1d22] text-xs uppercase tracking-wider text-[var(--qs-text-muted)]"><tr><th className="px-4 py-3">Seat</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-[var(--qs-border)]">
                  {seats.map((seat) => (
                    <tr key={seat.id}>
                      <td className="px-4 py-4"><p className="font-semibold">Row {seat.rowName} · Seat {seat.seatNumber}</p><p className="text-xs text-[var(--qs-text-muted)]">ID {seat.id}</p></td>
                      <td className="px-4 py-4"><Badge tone={seat.seatType === "COUPLE" ? "warning" : "neutral"}>{seat.seatType}</Badge></td>
                      <td className="px-4 py-4">{seat.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}</td>
                      <td className="px-4 py-4"><div className="flex justify-end gap-2">
                        <Button className="min-h-10 px-3 text-xs" onClick={() => { setMutationError(""); setFieldErrors({}); setEditSeat(seat); }} variant="ghost">Edit</Button>
                        <Button className="min-h-10 px-3 text-xs" onClick={() => { setStatusError(""); setStatusTarget(seat); }} variant={seat.active ? "danger" : "secondary"}>{seat.active ? "Deactivate" : "Activate"}</Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <div><Link className="text-sm font-semibold text-[var(--qs-primary)] hover:underline" href={`/admin/cinemas/${cinemaId}/screens`}>Back to screens</Link></div>
      {layoutOpen ? <SeatLayoutDialog error={mutationError} fieldErrors={fieldErrors} onClose={() => setLayoutOpen(false)} onSubmit={generateLayout} open pending={pending} /> : null}
      {editSeat ? <SeatFormDialog error={mutationError} fieldErrors={fieldErrors} onClose={() => setEditSeat(null)} onSubmit={saveSeat} open pending={pending} seat={editSeat} /> : null}
      <StatusConfirmationDialog active={statusTarget?.active ?? false} entityLabel="Seat" error={statusError} onClose={() => !pending && setStatusTarget(null)} onConfirm={() => void confirmStatus()} open={Boolean(statusTarget)} pending={pending} />
    </div>
  );
}
