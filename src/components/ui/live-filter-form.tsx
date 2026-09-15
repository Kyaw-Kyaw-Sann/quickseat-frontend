"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";
import type { FormHTMLAttributes } from "react";

type LiveFilterFormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "action" | "method" | "onChange" | "onSubmit"
> & {
  debounceMs?: number;
};

const debouncedInputTypes = new Set(["search", "text", "number"]);

export function LiveFilterForm({
  children,
  debounceMs = 350,
  ...props
}: LiveFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
      if (!element.name || element === document.activeElement) continue;
      const fallback = element instanceof HTMLInputElement
        ? element.defaultValue
        : Array.from(element.options).find((option) => option.defaultSelected)?.value ?? "";
      element.value = searchParams.get(element.name) ?? fallback;
    }
  }, [searchParams]);

  const commit = useCallback(
    (form: HTMLFormElement) => {
      const formData = new FormData(form);
      const params = new URLSearchParams(searchParams.toString());
      const fieldNames = new Set(
        Array.from(form.elements)
          .map((element) => (element as HTMLInputElement).name)
          .filter(Boolean),
      );

      fieldNames.forEach((name) => params.delete(name));
      formData.forEach((value, name) => {
        const normalized = String(value).trim();
        if (normalized) params.set(name, normalized);
      });
      params.delete("page");

      const query = params.toString();
      const href = `${pathname}${query ? `?${query}` : ""}`;
      const currentQuery = searchParams.toString();
      const currentHref = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;

      if (href === currentHref) return;
      startTransition(() => router.replace(href, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  function schedule(form: HTMLFormElement, delayed: boolean) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!delayed) {
      commit(form);
      return;
    }
    timerRef.current = setTimeout(() => commit(form), debounceMs);
  }

  return (
    <form
      {...props}
      aria-busy={isPending}
      onChange={(event) => {
        const target = event.target;
        const delayed =
          target instanceof HTMLInputElement &&
          debouncedInputTypes.has(target.type);
        schedule(event.currentTarget, delayed);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        schedule(event.currentTarget, false);
      }}
      ref={formRef}
    >
      {children}
      <span aria-live="polite" className="sr-only">
        {isPending ? "Updating filtered results" : ""}
      </span>
    </form>
  );
}
