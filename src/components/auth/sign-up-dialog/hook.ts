import { useCallback, useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { INVALID_PASSWORD } from "../../../../convex/errors";

export function useSignUpDialogModel(onSuccess: () => void) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      try {
        const formData = new FormData(event.currentTarget);
        if (formData.get("password") !== formData.get("confirmPassword")) {
          toast.error("Passwords do not match");
          return;
        }

        await signIn("password", formData);
        toast.success("Account created successfully");
        onSuccess();
      } catch (error) {
        console.error(error);
        const toastTitle =
          error instanceof ConvexError && error.data === INVALID_PASSWORD
            ? "Invalid password - check the requirements and try again."
            : "Could not create account";
        toast.error(toastTitle);
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess, signIn]
  );

  return {
    submitting,
    handleSubmit,
  };
}
