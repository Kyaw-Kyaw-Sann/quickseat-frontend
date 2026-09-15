import { Button } from "@/components/ui/button";

type AdminPaginationProps = {
  page: number;
  totalElements: number;
  totalPages: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  page,
  totalElements,
  totalPages,
  itemLabel,
  onPageChange,
}: AdminPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--qs-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--qs-text-muted)]">
        {totalElements} {itemLabel} · Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
      </p>
      <div className="flex gap-2 [&>*]:flex-1 sm:[&>*]:flex-none" aria-label={`${itemLabel} pagination`}>
        <Button
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          variant="secondary"
        >
          Previous
        </Button>
        <Button
          disabled={totalPages === 0 || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          variant="secondary"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
