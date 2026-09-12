import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: string;
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
  const tone = statusTone[status as keyof typeof statusTone] ?? "neutral";

  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
