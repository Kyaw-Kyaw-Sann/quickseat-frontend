import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AdminNotice } from "@/features/admin/components/admin-notice";

export function ShowtimeActionDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  danger = false,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  danger?: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && !pending && onClose()} open={open} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--qs-text-muted)]">{description}</p>
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose} variant="ghost">Cancel</Button>
          <Button disabled={pending} onClick={onConfirm} variant={danger ? "danger" : "primary"}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
