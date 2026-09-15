"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import type { AdminSeat, AdminSeatInput, SeatType } from "@/features/admin/types";
import type { FieldErrors } from "@/lib/api/types";

export function SeatFormDialog({
  open,
  seat,
  pending,
  error,
  fieldErrors,
  onClose,
  onSubmit,
}: {
  open: boolean;
  seat: AdminSeat | null;
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: AdminSeatInput) => Promise<void>;
}) {
  const [rowName, setRowName] = useState(seat?.rowName ?? "");
  const [seatNumber, setSeatNumber] = useState(seat?.seatNumber ?? 1);
  const [seatType, setSeatType] = useState<SeatType>(seat?.seatType ?? "NORMAL");

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && !pending && onClose()} open={open} title="Edit seat">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) void onSubmit({ rowName, seatNumber, seatType });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="seat-row-name">
            Row name
            <Input error={fieldErrors.rowName} id="seat-row-name" onChange={(event) => setRowName(event.target.value)} required value={rowName} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="seat-number">
            Seat number
            <Input error={fieldErrors.seatNumber} id="seat-number" min={1} onChange={(event) => setSeatNumber(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} required type="number" value={seatNumber} />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="seat-type">
          Seat type
          <Select error={fieldErrors.seatType} id="seat-type" onChange={(event) => setSeatType(event.target.value as SeatType)} value={seatType}>
            <option value="NORMAL">NORMAL</option>
            <option value="COUPLE">COUPLE</option>
          </Select>
        </label>
        <p className="text-xs text-[var(--qs-text-muted)]">A COUPLE seat remains one physical backend seat unit.</p>
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={pending} type="submit">{pending ? "Saving…" : "Save seat"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
