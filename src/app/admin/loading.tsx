import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPageLoading() {
  return (
    <div aria-label="Loading admin page" className="space-y-6" role="status">
      <div className="space-y-3 border-b border-[var(--qs-border)] pb-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-52 w-full max-w-3xl" />
    </div>
  );
}
