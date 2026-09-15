"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import type { AdminScreen, AdminScreenInput } from "@/features/admin/types";
import type { FieldErrors } from "@/lib/api/types";

export function ScreenFormDialog({
  open,
  screen,
  pending,
  error,
  fieldErrors,
  onClose,
  onSubmit,
}: {
  open: boolean;
  screen: AdminScreen | null;
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: AdminScreenInput) => Promise<void>;
}) {
  const [name, setName] = useState(screen?.name ?? "");

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && !pending && onClose()} open={open} title={screen ? "Edit screen" : "Create screen"}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) void onSubmit({ name });
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="screen-name">
          Screen name
          <Input error={fieldErrors.name} id="screen-name" onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={pending} type="submit">{pending ? "Saving…" : screen ? "Save changes" : "Create screen"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
