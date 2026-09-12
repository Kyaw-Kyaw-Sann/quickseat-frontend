import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

type ErrorStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <Card className="grid place-items-center gap-3 border-[#6d2428] py-10 text-center">
      <span aria-hidden="true" className="text-2xl text-[#ff8585]">
        !
      </span>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-[var(--qs-text-muted)]">
          {description}
        </p>
      </div>
      {action}
    </Card>
  );
}
