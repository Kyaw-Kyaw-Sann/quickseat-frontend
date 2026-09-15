import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status?: string | null;
};

const statusTone = {
  ACTIVE: "success",
  AVAILABLE: "success",
  CONFIRMED: "success",
  SUCCESS: "success",
  PENDING: "warning",
  HELD: "warning",
  UPCOMING: "primary",
  USED: "neutral",
  CANCELLED: "danger",
  EXPIRED: "danger",
  FAILED: "danger",
  BOOKED: "neutral",
  UNAVAILABLE: "neutral",
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = typeof status === "string" && status.trim()
    ? status
    : "NOT_PROVIDED";
  const tone = statusTone[normalizedStatus as keyof typeof statusTone] ?? "neutral";

  return <Badge tone={tone}>{normalizedStatus.replaceAll("_", " ")}</Badge>;
}
