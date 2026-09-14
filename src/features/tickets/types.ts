export type TicketStatus = "ACTIVE" | "USED" | "CANCELLED";

export type TicketGenerationResult = {
  ticketId: number;
  ticketToken: string;
  status: TicketStatus;
  qrImageUrl: string;
  bookingReference: string;
  alreadyGenerated: boolean;
};

export type TicketDetail = {
  ticketToken: string;
  status: string;
  bookingReference: string;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  totalAmount: number;
  seats: unknown[];
};
