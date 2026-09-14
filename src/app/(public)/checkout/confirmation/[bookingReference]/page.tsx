import { notFound } from "next/navigation";
import { BookingConfirmation } from "@/features/bookings/components/booking-confirmation";

type BookingConfirmationPageProps = {
  params: Promise<{ bookingReference: string }>;
};

export default async function BookingConfirmationPage({
  params,
}: BookingConfirmationPageProps) {
  const { bookingReference: routeReference } = await params;
  const bookingReference = routeReference.trim();

  if (!bookingReference) notFound();

  return <BookingConfirmation bookingReference={bookingReference} />;
}
