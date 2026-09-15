export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  role?: "CUSTOMER";
  phone?: string | null;
};

export type AdminStaff = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  cinemaId: number;
  role?: "STAFF";
  phone?: string | null;
  cinemaName?: string | null;
};

export type AdminCustomerListParams = {
  search?: string;
  active?: boolean;
  emailVerified?: boolean;
  page?: number;
  size?: number;
};

export type AdminStaffListParams = {
  search?: string;
  active?: boolean;
  cinemaId?: number;
  page?: number;
  size?: number;
};

export type AdminStaffCreateInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  cinemaId: number;
};

export type AdminStaffUpdateInput = {
  name: string;
  email: string;
  phone: string;
  password?: string;
};

export type AdminStaffCinemaInput = {
  cinemaId: number;
};
