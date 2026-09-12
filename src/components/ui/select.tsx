import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { children, className, error, id, ...props },
  ref,
) {
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className="grid gap-1.5">
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-11 w-full rounded-lg border bg-[var(--qs-background)] px-3 text-sm text-[var(--qs-text)] outline-none disabled:opacity-50",
          error
            ? "border-[var(--qs-danger)]"
            : "border-[var(--qs-border)] focus:border-[var(--qs-primary)]",
          className,
        )}
        id={id}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-sm text-[#ff8585]" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
