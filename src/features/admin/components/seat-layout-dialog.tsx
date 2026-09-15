"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import type { SeatLayoutInput, SeatLayoutRowInput } from "@/features/admin/types";
import type { FieldErrors } from "@/lib/api/types";

const emptyRow = (): SeatLayoutRowInput => ({ rowName: "", normalSeats: 0, coupleSeats: 0 });

export function SeatLayoutDialog({
  open,
  pending,
  error,
  fieldErrors,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: SeatLayoutInput) => Promise<void>;
}) {
  const [rows, setRows] = useState<SeatLayoutRowInput[]>([emptyRow()]);

  function updateRow(index: number, field: keyof SeatLayoutRowInput, value: string | number) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  }

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && !pending && onClose()} open={open} title="Generate seat layout">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) void onSubmit({ rows });
        }}
      >
        <p className="text-sm text-[var(--qs-text-muted)]">
          Add physical seats by row using the backend layout generator. Couple seats are generated as single seat units.
        </p>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {rows.map((row, index) => (
            <fieldset className="rounded-lg border border-[var(--qs-border)] p-3" key={index}>
              <legend className="px-1 text-xs font-semibold text-[var(--qs-text-muted)]">Row {index + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 text-xs font-medium" htmlFor={`layout-row-${index}`}>
                  Row name
                  <Input error={fieldErrors[`rows[${index}].rowName`]} id={`layout-row-${index}`} onChange={(event) => updateRow(index, "rowName", event.target.value)} required value={row.rowName} />
                </label>
                <label className="grid gap-1 text-xs font-medium" htmlFor={`layout-normal-${index}`}>
                  Normal seats
                  <Input error={fieldErrors[`rows[${index}].normalSeats`]} id={`layout-normal-${index}`} min={0} onChange={(event) => updateRow(index, "normalSeats", Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} required type="number" value={row.normalSeats} />
                </label>
                <label className="grid gap-1 text-xs font-medium" htmlFor={`layout-couple-${index}`}>
                  Couple seats
                  <Input error={fieldErrors[`rows[${index}].coupleSeats`]} id={`layout-couple-${index}`} min={0} onChange={(event) => updateRow(index, "coupleSeats", Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} required type="number" value={row.coupleSeats} />
                </label>
              </div>
              {rows.length > 1 ? <Button className="mt-2 min-h-9 px-2 text-xs" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} variant="ghost">Remove row</Button> : null}
            </fieldset>
          ))}
        </div>
        <Button onClick={() => setRows((current) => [...current, emptyRow()])} variant="secondary">Add row</Button>
        {fieldErrors.rows ? <AdminNotice message={fieldErrors.rows} /> : null}
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={pending} type="submit">{pending ? "Generating…" : "Generate seats"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
