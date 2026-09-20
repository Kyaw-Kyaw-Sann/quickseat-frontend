"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  variant?: "modal" | "drawer";
};

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  variant = "modal",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby={titleId}
      className={cn(
        "overscroll-contain overflow-y-auto border border-[var(--qs-border)] bg-[var(--qs-surface)] p-0 text-[var(--qs-text)] shadow-2xl backdrop:bg-black/75",
        variant === "drawer"
          ? "my-0 ml-auto mr-0 h-dvh max-h-none w-[min(92vw,24rem)] max-w-full rounded-none border-y-0 border-r-0"
          : "fixed inset-0 m-auto max-h-[calc(100dvh-1rem)] w-[min(100%-1rem,32rem)] rounded-lg sm:max-h-[calc(100dvh-2rem)] sm:w-[min(100%-2rem,32rem)]",
      )}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--qs-border)] bg-[var(--qs-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-semibold" id={titleId}>
          {title}
        </h2>
        <Button
          aria-label="Close dialog"
          className="min-h-11 min-w-11 shrink-0 px-0 py-0 text-xl"
          onClick={() => onOpenChange(false)}
          variant="ghost"
        >
          ×
        </Button>
      </div>
      <div className="min-w-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">{children}</div>
    </dialog>
  );
}
