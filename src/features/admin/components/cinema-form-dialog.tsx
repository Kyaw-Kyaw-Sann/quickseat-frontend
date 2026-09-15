"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AdminNotice } from "@/features/admin/components/admin-notice";
import { getAdminMutationError } from "@/features/admin/errors";
import type { AdminCinema, AdminCinemaInput } from "@/features/admin/types";
import { uploadAdminCinemaImage } from "@/lib/api/admin-cinema-management";
import type { FieldErrors } from "@/lib/api/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type CinemaFormDialogProps = {
  open: boolean;
  cinema: AdminCinema | null;
  pending: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onClose: () => void;
  onSubmit: (input: AdminCinemaInput) => Promise<void>;
};

export function CinemaFormDialog({
  open,
  cinema,
  pending,
  error,
  fieldErrors,
  onClose,
  onSubmit,
}: CinemaFormDialogProps) {
  const [form, setForm] = useState<AdminCinemaInput>(() => toForm(cinema));
  const [previewUrl, setPreviewUrl] = useState(cinema?.imageUrl ?? "");
  const [objectUrl, setObjectUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function updateField(field: keyof AdminCinemaInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImage(file: File | undefined) {
    if (!file || uploading || pending) return;
    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Select an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Cinema images must be 5 MB or smaller.");
      return;
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);
    setPreviewUrl(nextObjectUrl);
    setUploading(true);

    try {
      const response = await uploadAdminCinemaImage(file);
      updateField("imageUrl", response.data.url);
      setPreviewUrl(response.data.url);
    } catch (uploadFailure) {
      const normalized = getAdminMutationError(uploadFailure);
      setUploadError(normalized.fieldErrors.file ?? normalized.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => !nextOpen && !pending && !uploading && onClose()}
      open={open}
      title={cinema ? "Edit cinema" : "Create cinema"}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending && !uploading && !uploadError) void onSubmit(form);
        }}
      >
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="cinema-name">
          Name
          <Input
            error={fieldErrors.name}
            id="cinema-name"
            onChange={(event) => updateField("name", event.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium" htmlFor="cinema-address">
          Address
          <Input
            error={fieldErrors.address}
            id="cinema-address"
            onChange={(event) => updateField("address", event.target.value)}
            required
            value={form.address}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="cinema-city">
            City
            <Input
              error={fieldErrors.city}
              id="cinema-city"
              onChange={(event) => updateField("city", event.target.value)}
              required
              value={form.city}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="cinema-phone">
            Phone
            <Input
              error={fieldErrors.phone}
              id="cinema-phone"
              onChange={(event) => updateField("phone", event.target.value)}
              type="tel"
              value={form.phone}
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="cinema-image">
            Cinema image
          </label>
          {previewUrl ? (
            <div
              aria-label="Cinema image preview"
              className="h-36 rounded-lg border border-[var(--qs-border)] bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${JSON.stringify(previewUrl).slice(1, -1)})` }}
            />
          ) : (
            <div className="grid h-28 place-items-center rounded-lg border border-dashed border-[var(--qs-border)] text-sm text-[var(--qs-text-muted)]">
              No image selected
            </div>
          )}
          <Input
            accept="image/*"
            aria-describedby="cinema-image-help"
            disabled={pending || uploading}
            error={fieldErrors.imageUrl ?? uploadError}
            id="cinema-image"
            onChange={(event) => void handleImage(event.target.files?.[0])}
            type="file"
          />
          <p className="text-xs text-[var(--qs-text-muted)]" id="cinema-image-help">
            Image file, maximum 5 MB. The uploaded URL is stored automatically.
          </p>
          {uploading ? <p className="text-sm text-[var(--qs-warning)]" role="status">Uploading image…</p> : null}
        </div>

        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button disabled={pending || uploading} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={pending || uploading || Boolean(uploadError)} type="submit">
            {pending ? "Saving…" : cinema ? "Save changes" : "Create cinema"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function toForm(cinema: AdminCinema | null): AdminCinemaInput {
  return {
    name: cinema?.name ?? "",
    address: cinema?.address ?? "",
    city: cinema?.city ?? "",
    phone: cinema?.phone ?? "",
    imageUrl: cinema?.imageUrl ?? "",
  };
}
