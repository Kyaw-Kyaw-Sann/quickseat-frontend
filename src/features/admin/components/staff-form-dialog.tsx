"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import type { AdminCinema } from "@/features/admin/types";
import type { AdminStaff, AdminStaffCreateInput, AdminStaffUpdateInput } from "@/features/admin/user-types";
import type { FieldErrors } from "@/lib/api/types";

type StaffFormDialogProps = {
  staff: AdminStaff | null;
  cinemas: AdminCinema[];
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: AdminStaffCreateInput | AdminStaffUpdateInput) => Promise<void>;
};

export function StaffFormDialog({ staff, cinemas, pending, error, fieldErrors, onClose, onSubmit }: StaffFormDialogProps) {
  const [name, setName] = useState(staff?.name ?? "");
  const [email, setEmail] = useState(staff?.email ?? "");
  const [phone, setPhone] = useState(staff?.phone ?? "");
  const [password, setPassword] = useState("");
  const [cinemaId, setCinemaId] = useState(String(cinemas[0]?.id ?? ""));

  return (
    <Dialog onOpenChange={(open) => !open && !pending && onClose()} open title={staff ? "Edit staff profile" : "Create staff account"}>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        if (staff) {
          void onSubmit({ name, email, phone, ...(password ? { password } : {}) });
        } else {
          void onSubmit({ name, email, password, phone, cinemaId: Number(cinemaId) });
        }
      }}>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-name">Name<Input error={fieldErrors.name} id="staff-name" onChange={(event) => setName(event.target.value)} required value={name} /></label>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-email">Email<Input error={fieldErrors.email} id="staff-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-phone">Phone<Input error={fieldErrors.phone} id="staff-phone" onChange={(event) => setPhone(event.target.value)} required type="tel" value={phone} /></label>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-password">
          {staff ? "New password (optional)" : "Password"}
          <Input autoComplete="new-password" error={fieldErrors.password} id="staff-password" onChange={(event) => setPassword(event.target.value)} required={!staff} type="password" value={password} />
        </label>
        {!staff ? (
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="staff-cinema">Assigned cinema<Select error={fieldErrors.cinemaId} id="staff-cinema" onChange={(event) => setCinemaId(event.target.value)} required value={cinemaId}><option disabled value="">Select one active cinema</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}</Select></label>
        ) : null}
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2 pt-2"><Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button><Button disabled={pending || (!staff && !cinemaId)} type="submit">{pending ? "Saving…" : staff ? "Save profile" : "Create staff"}</Button></div>
      </form>
    </Dialog>
  );
}
