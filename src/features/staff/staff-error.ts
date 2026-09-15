import { isApiRequestError } from "@/lib/api/errors";
import type { FieldErrors } from "@/lib/api/types";

export type StaffRequestError = {
  message: string;
  isNetworkError: boolean;
  status: number;
  fieldErrors: FieldErrors;
};

export function getStaffError(error: unknown): StaffRequestError {
  if (isApiRequestError(error)) {
    return {
      message: error.message,
      isNetworkError: error.isNetworkError,
      status: error.status,
      fieldErrors: error.fieldErrors ?? {},
    };
  }

  return {
    message: "The staff workspace could not complete this request. Please try again.",
    isNetworkError: false,
    status: 0,
    fieldErrors: {},
  };
}
