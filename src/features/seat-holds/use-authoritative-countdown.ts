"use client";

import { useEffect, useRef, useState } from "react";

type AuthoritativeCountdownOptions = {
  active: boolean;
  remainingSeconds: number;
  onElapsed: () => void;
};

export function useAuthoritativeCountdown({
  active,
  remainingSeconds,
  onElapsed,
}: AuthoritativeCountdownOptions): number {
  const [displaySeconds, setDisplaySeconds] = useState(
    Math.max(0, remainingSeconds),
  );
  const onElapsedRef = useRef(onElapsed);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    if (!active) return;

    const deadline = performance.now() + Math.max(0, remainingSeconds) * 1000;
    let elapsedNotified = false;

    function tick() {
      const nextRemaining = Math.max(
        0,
        Math.ceil((deadline - performance.now()) / 1000),
      );
      setDisplaySeconds(nextRemaining);

      if (nextRemaining === 0 && !elapsedNotified) {
        elapsedNotified = true;
        onElapsedRef.current();
      }
    }

    const initialTick = window.setTimeout(tick, 0);
    const countdown = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(countdown);
    };
  }, [active, remainingSeconds]);

  return displaySeconds;
}

export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
