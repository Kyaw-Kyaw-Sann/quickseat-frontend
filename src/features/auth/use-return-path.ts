"use client";

import { getSafeReturnPath } from "@/features/auth/return-path";
import { useEffect, useState } from "react";

export function useReturnPath(fallback = "/"): string {
  const [returnTo, setReturnTo] = useState(fallback);

  useEffect(() => {
    const update = window.setTimeout(() => {
      setReturnTo(getSafeReturnPath(window.location.search, fallback));
    }, 0);

    return () => window.clearTimeout(update);
  }, [fallback]);

  return returnTo;
}
