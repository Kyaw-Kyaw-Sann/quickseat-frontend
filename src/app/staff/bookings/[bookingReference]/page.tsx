import { StaffBookingDetailPage } from "@/features/staff/components/staff-pages";
export default async function StaffBookingRoute({ params }: { params: Promise<{ bookingReference: string }> }) { const { bookingReference } = await params; return <StaffBookingDetailPage bookingReference={bookingReference} />; }
