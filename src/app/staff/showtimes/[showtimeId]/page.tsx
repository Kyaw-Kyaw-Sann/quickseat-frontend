import { notFound } from "next/navigation";
import { StaffShowtimeDetailPage } from "@/features/staff/components/staff-pages";
export default async function StaffShowtimeRoute({ params }: { params: Promise<{ showtimeId: string }> }) { const { showtimeId } = await params; const id = Number(showtimeId); if (!Number.isSafeInteger(id) || id <= 0) notFound(); return <StaffShowtimeDetailPage showtimeId={id} />; }
