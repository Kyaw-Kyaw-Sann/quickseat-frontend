import type {
  AdminCustomer,
  AdminCustomerListParams,
  AdminStaff,
  AdminStaffCinemaInput,
  AdminStaffCreateInput,
  AdminStaffListParams,
  AdminStaffUpdateInput,
} from "@/features/admin/user-types";
import type { ActiveStatusInput } from "@/features/admin/types";
import { apiClient } from "@/lib/api/client";
import type { ApiSuccess, PaginatedResponse } from "@/lib/api/types";

const noStore = { cache: "no-store" as const };

export function getAdminCustomers(
  params: AdminCustomerListParams = {},
): Promise<ApiSuccess<PaginatedResponse<AdminCustomer>>> {
  return apiClient<PaginatedResponse<AdminCustomer>>("/admin/customers", {
    ...noStore,
    query: params,
  });
}

export function getAdminCustomer(userId: number): Promise<ApiSuccess<AdminCustomer>> {
  return apiClient<AdminCustomer>(`/admin/customers/${userId}`, noStore);
}

export function updateAdminCustomerActive(
  userId: number,
  input: ActiveStatusInput,
): Promise<ApiSuccess<AdminCustomer>> {
  return apiClient<AdminCustomer>(`/admin/customers/${userId}/active`, {
    method: "PATCH",
    body: input,
  });
}

export function getAdminStaff(
  params: AdminStaffListParams = {},
): Promise<ApiSuccess<PaginatedResponse<AdminStaff>>> {
  return apiClient<PaginatedResponse<AdminStaff>>("/admin/staff", {
    ...noStore,
    query: params,
  });
}

export function getAdminStaffMember(staffId: number): Promise<ApiSuccess<AdminStaff>> {
  return apiClient<AdminStaff>(`/admin/staff/${staffId}`, noStore);
}

export function createAdminStaff(
  input: AdminStaffCreateInput,
): Promise<ApiSuccess<AdminStaff>> {
  return apiClient<AdminStaff>("/admin/staff", { method: "POST", body: input });
}

export function updateAdminStaff(
  staffId: number,
  input: AdminStaffUpdateInput,
): Promise<ApiSuccess<AdminStaff>> {
  return apiClient<AdminStaff>(`/admin/staff/${staffId}`, {
    method: "PUT",
    body: input,
  });
}

export function updateAdminStaffActive(
  staffId: number,
  input: ActiveStatusInput,
): Promise<ApiSuccess<AdminStaff>> {
  return apiClient<AdminStaff>(`/admin/staff/${staffId}/active`, {
    method: "PATCH",
    body: input,
  });
}

export function updateAdminStaffCinema(
  staffId: number,
  input: AdminStaffCinemaInput,
): Promise<ApiSuccess<AdminStaff>> {
  return apiClient<AdminStaff>(`/admin/staff/${staffId}/cinema`, {
    method: "PATCH",
    body: input,
  });
}
