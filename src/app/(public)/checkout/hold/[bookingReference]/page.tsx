import { notFound } from "next/navigation";
import { SeatHoldCheckout } from "@/features/seat-holds/components/seat-hold-checkout";

type SeatHoldPageProps = {
  params: Promise<{ bookingReference: string }>;
  searchParams: Promise<{ showtimeId?: string | string[] }>;
};

export default async function SeatHoldPage({
  params,
  searchParams,
}: SeatHoldPageProps) {
  const { bookingReference: routeReference } = await params;
  const { showtimeId: rawShowtimeId } = await searchParams;
  const bookingReference = routeReference.trim();
  const showtimeValue = Array.isArray(rawShowtimeId)
    ? rawShowtimeId[0]
    : rawShowtimeId;
  const parsedShowtimeId = showtimeValue ? Number(showtimeValue) : undefined;

  if (!bookingReference) notFound();

  const showtimeId =
    parsedShowtimeId !== undefined &&
    Number.isSafeInteger(parsedShowtimeId) &&
    parsedShowtimeId > 0
      ? parsedShowtimeId
      : undefined;

  return (
    <SeatHoldCheckout
      bookingReference={bookingReference}
      showtimeId={showtimeId}
    />
  );
}
