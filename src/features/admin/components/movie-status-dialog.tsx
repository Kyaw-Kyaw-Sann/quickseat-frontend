"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import type { AdminMovie } from "@/features/admin/movie-types";
import type { MovieStatus } from "@/features/movies/types";

export function MovieStatusDialog({
  movie,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  movie: AdminMovie;
  pending: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (status: MovieStatus) => Promise<void>;
}) {
  const [status, setStatus] = useState<MovieStatus>(movie.status);

  return (
    <Dialog onOpenChange={(open) => !open && !pending && onClose()} open title="Change movie lifecycle status">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending && status !== movie.status) void onConfirm(status);
        }}
      >
        <p className="text-sm text-[var(--qs-text-muted)]">
          Update the lifecycle status for <strong className="text-[var(--qs-text)]">{movie.title}</strong>. This does not change its active state.
        </p>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="movie-lifecycle-status">
          Lifecycle status
          <Select id="movie-lifecycle-status" onChange={(event) => setStatus(event.target.value as MovieStatus)} value={status}>
            <option value="UPCOMING">UPCOMING</option>
            <option value="NOW_SHOWING">NOW SHOWING</option>
            <option value="ENDED">ENDED</option>
          </Select>
        </label>
        {status === "ENDED" ? <AdminNotice message="ENDED movies must not be used as candidates for future showtime operations." /> : null}
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={pending || status === movie.status} type="submit">{pending ? "Saving…" : "Update status"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
