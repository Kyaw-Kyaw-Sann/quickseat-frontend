import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AdminNotice } from "@/features/admin/components/admin-notice";

type StatusConfirmationDialogProps = {
  open: boolean;
  entityLabel: string;
  active: boolean;
  pending: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function StatusConfirmationDialog({
  open,
  entityLabel,
  active,
  pending,
  error,
  onClose,
  onConfirm,
}: StatusConfirmationDialogProps) {
  const action = active ? "Deactivate" : "Activate";

  return (
    <Dialog onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open} title={`${action} ${entityLabel}`}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--qs-text-muted)]">
          {active
            ? `Inactive ${entityLabel.toLowerCase()} records must not be used for new operational flows.`
            : `This will make the ${entityLabel.toLowerCase()} available for eligible operational flows again.`}
        </p>
        {error ? <AdminNotice message={error} /> : null}
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={onConfirm}
            variant={active ? "danger" : "primary"}
          >
            {pending ? "Saving…" : action}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
