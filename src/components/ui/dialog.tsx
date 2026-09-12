"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-labelledby="quickseat-dialog-title"
      className="w-[min(100%-2rem,32rem)] rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] p-0 text-[var(--qs-text)] shadow-2xl backdrop:bg-black/75"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      ref={dialogRef}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--qs-border)] p-5">
        <h2 className="text-lg font-semibold" id="quickseat-dialog-title">
          {title}
        </h2>
        <Button
          aria-label="Close dialog"
          className="min-h-0 px-2 py-1"
          onClick={() => onOpenChange(false)}
          variant="ghost"
        >
          ×
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
