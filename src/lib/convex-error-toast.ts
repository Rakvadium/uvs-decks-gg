import { toast } from "sonner";

export function getConvexErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}

export function toastConvexError(error: unknown, fallback: string) {
  toast.error(getConvexErrorMessage(error, fallback));
}
