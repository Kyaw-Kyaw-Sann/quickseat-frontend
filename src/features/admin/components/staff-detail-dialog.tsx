import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminStaff } from "@/features/admin/user-types";

export function StaffDetailDialog({ staff, onClose }: { staff: AdminStaff; onClose: () => void }) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open title="Staff detail">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-lg font-semibold">{staff.name}</p><p className="mt-1 text-sm text-[var(--qs-text-muted)]">Staff ID {staff.id}</p></div>
          {staff.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Email" value={staff.email} />
          <Detail label="Assigned cinema" value={staff.cinemaName ?? `Cinema ID ${staff.cinemaId}`} />
          {staff.phone ? <Detail label="Phone" value={staff.phone} /> : null}
          {staff.role ? <Detail label="Role" value={staff.role} /> : null}
        </dl>
      </div>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>;
}
