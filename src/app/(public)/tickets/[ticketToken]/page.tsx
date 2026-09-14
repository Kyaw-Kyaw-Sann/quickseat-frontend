import { TicketView } from "@/features/tickets/components/ticket-view";
import { notFound } from "next/navigation";

type TicketPageProps = {
  params: Promise<{ ticketToken: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  const { ticketToken: routeToken } = await params;
  const ticketToken = routeToken.trim();

  if (!ticketToken) notFound();

  return <TicketView ticketToken={ticketToken} />;
}
