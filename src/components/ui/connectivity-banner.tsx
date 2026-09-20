"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot() {
  return !window.navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function ConnectivityBanner() {
  const isOffline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[100] w-[min(calc(100%-2rem),30rem)] -translate-x-1/2 rounded-xl border border-[#76591f] bg-[#2b220f] px-4 py-3 text-center text-sm font-medium text-[#f5d58a] shadow-2xl"
      role="status"
    >
      You&apos;re offline. QuickSeat will reconnect when your network returns.
    </div>
  );
}
