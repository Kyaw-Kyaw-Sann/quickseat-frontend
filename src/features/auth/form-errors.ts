import { isApiRequestError } from "@/lib/api/errors";
import type { FieldErrors } from "@/lib/api/types";

export type AuthFormError = {
  message: string;
  fieldErrors: FieldErrors;
};

export function getAuthFormError(error: unknown): AuthFormError {
  if (isApiRequestError(error)) {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors ?? {},
    };
  }

  return {
    message: "Something went wrong. Please try again.",
    fieldErrors: {},
  };
}
