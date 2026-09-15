import { isApiRequestError } from "@/lib/api/errors";
import type { FieldErrors } from "@/lib/api/types";

export type AdminMutationError = {
  message: string;
  fieldErrors: FieldErrors;
  isNetworkError: boolean;
  status: number;
};

export function getAdminMutationError(error: unknown): AdminMutationError {
  if (isApiRequestError(error)) {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors ?? {},
      isNetworkError: error.isNetworkError,
      status: error.status,
    };
  }

  return {
    message: "The operation could not be completed. Please try again.",
    fieldErrors: {},
    isNetworkError: false,
    status: 0,
  };
}
