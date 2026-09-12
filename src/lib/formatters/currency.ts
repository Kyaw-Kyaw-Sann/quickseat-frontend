const mmkFormatter = new Intl.NumberFormat("en-MM", {
  style: "currency",
  currency: "MMK",
  maximumFractionDigits: 0,
});

export function formatMMK(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "—";
  }

  return mmkFormatter.format(amount);
}
