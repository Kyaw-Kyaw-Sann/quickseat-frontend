import { isApiRequestError } from "@/lib/api/errors";

export function isVerificationRequiredError(error: unknown): boolean {
  if (!isApiRequestError(error) || error.status !== 403) return false;
  return `${error.code} ${error.message}`.toLowerCase().includes("verif");
}
