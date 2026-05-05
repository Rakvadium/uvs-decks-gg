import { useCallback, useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { INVALID_PASSWORD } from "../../../../convex/errors";
import { clearAuthCookies, isRefreshTokenParseError } from "../auth-recovery";

export function useSignUpDialogModel(onSuccess: () => void) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      const form = event.currentTarget;

      const formData = new FormData(form);
      if (formData.get("password") !== formData.get("confirmPassword")) {
        toast.error("Passwords do not match");
        setSubmitting(false);
        return;
      }
      const usernameRaw = formData.get("username");
      const username =
        typeof usernameRaw === "string" ? usernameRaw.trim() : "";
      if (!username) {
        toast.error("Username is required");
        setSubmitting(false);
        return;
      }
      const signUpFormData = () => {
        const fd = new FormData();
        for (const [key, value] of new FormData(form).entries()) {
          if (key === "username") {
            fd.append(key, username);
          } else {
            fd.append(key, value);
          }
        }
        return fd;
      };

      try {
        const runSignUp = () => signIn("password", signUpFormData());
        const result = await runSignUp();
        if (!result.signingIn) {
          toast.error("Account creation requires an additional step");
          return;
        }
        toast.success("Account created successfully");
        onSuccess();
      } catch (error) {
        if (isRefreshTokenParseError(error)) {
          try {
            await clearAuthCookies();
            const retryResult = await signIn("password", signUpFormData());
            if (!retryResult.signingIn) {
              toast.error("Account creation requires an additional step");
              return;
            }
            toast.success("Account created successfully");
            onSuccess();
            return;
          } catch (retryError) {
            console.error(retryError);
          }
        }
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
