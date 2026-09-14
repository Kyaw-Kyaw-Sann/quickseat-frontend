import { notFound } from "next/navigation";
import { PaymentCheckout } from "@/features/bookings/components/payment-checkout";

type PaymentPageProps = {
  params: Promise<{ bookingReference: string }>;
  searchParams: Promise<{ showtimeId?: string | string[] }>;
};

export default async function PaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
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
    <PaymentCheckout
      bookingReference={bookingReference}
      showtimeId={showtimeId}
    />
  );
}
