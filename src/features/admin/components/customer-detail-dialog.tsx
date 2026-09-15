import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminCustomer } from "@/features/admin/user-types";

export function CustomerDetailDialog({
  customer,
  onClose,
}: {
  customer: AdminCustomer;
  onClose: () => void;
}) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open title="Customer detail">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{customer.name}</p>
            <p className="mt-1 text-sm text-[var(--qs-text-muted)]">Customer ID {customer.id}</p>
          </div>
          {customer.active ? <StatusBadge status="ACTIVE" /> : <Badge tone="danger">INACTIVE</Badge>}
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Email" value={customer.email} />
          <Detail label="Email verification" value={customer.emailVerified ? "Verified" : "Not verified"} />
          {customer.phone ? <Detail label="Phone" value={customer.phone} /> : null}
          {customer.role ? <Detail label="Role" value={customer.role} /> : null}
        </dl>
      </div>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wider text-[var(--qs-text-muted)]">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>;
}
