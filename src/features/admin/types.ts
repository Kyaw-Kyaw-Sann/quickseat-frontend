export type SeatType = "NORMAL" | "COUPLE";

export type AdminCinema = {
  id: number;
  name: string;
  address?: string;
  city: string;
  phone?: string | null;
  imageUrl?: string | null;
  active: boolean;
};

export type AdminCinemaPage = {
  content: AdminCinema[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type AdminCinemaInput = {
  name: string;
  address: string;
  city: string;
  phone: string;
  imageUrl: string;
};

export type AdminScreen = {
  id: number;
  cinemaId: number;
  name: string;
  active: boolean;
};

export type AdminScreenInput = {
  name: string;
};

export type AdminSeat = {
  id: number;
  screenId: number;
  rowName: string;
  seatNumber: number;
  seatType: SeatType;
  active: boolean;
};

export type AdminSeatInput = {
  rowName: string;
  seatNumber: number;
  seatType: SeatType;
};

export type SeatLayoutRowInput = {
  rowName: string;
  normalSeats: number;
  coupleSeats: number;
};

export type SeatLayoutInput = {
  rows: SeatLayoutRowInput[];
};

export type ActiveStatusInput = {
  active: boolean;
};

export type AdminImageUpload = {
  url: string;
  publicId: string;
};
