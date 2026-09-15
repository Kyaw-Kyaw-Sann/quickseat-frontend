"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import type { AdminCinema } from "@/features/admin/types";
import type { AdminStaff } from "@/features/admin/user-types";
import type { FieldErrors } from "@/lib/api/types";

export function StaffCinemaDialog({ staff, cinemas, pending, error, fieldErrors, onClose, onConfirm }: {
  staff: AdminStaff;
  cinemas: AdminCinema[];
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onConfirm: (cinemaId: number) => Promise<void>;
}) {
  const [cinemaId, setCinemaId] = useState(String(staff.cinemaId));
  return (
    <Dialog onOpenChange={(open) => !open && !pending && onClose()} open title="Change cinema assignment">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!pending && cinemaId) void onConfirm(Number(cinemaId)); }}>
        <p className="text-sm text-[var(--qs-text-muted)]">{staff.name} will remain assigned to exactly one cinema. Only active cinemas are available for a new assignment.</p>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-assignment-cinema">Cinema<Select error={fieldErrors.cinemaId} id="staff-assignment-cinema" onChange={(event) => setCinemaId(event.target.value)} required value={cinemaId}><option disabled value="">Select one active cinema</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}</Select></label>
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2"><Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button><Button disabled={pending || !cinemaId || Number(cinemaId) === staff.cinemaId} type="submit">{pending ? "Saving…" : "Update assignment"}</Button></div>
      </form>
    </Dialog>
  );
}
