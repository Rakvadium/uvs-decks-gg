import { useCallback, useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { FLAGS } from "@/lib/flags";
import { clearAuthCookies, isRefreshTokenParseError } from "../auth-recovery";

export function useSignInDialogModel(onSuccess: () => void) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      const form = event.currentTarget;
      const runSignIn = () => signIn("password", new FormData(form));

      try {
        const result = await runSignIn();
        if (!result.signingIn) {
          toast.error("Sign-in requires an additional step");
          return;
        }
        toast.success("Signed in successfully");
        onSuccess();
      } catch (error) {
        if (isRefreshTokenParseError(error)) {
          try {
            await clearAuthCookies();
            const retryResult = await runSignIn();
            if (!retryResult.signingIn) {
              toast.error("Sign-in requires an additional step");
              return;
            }
            toast.success("Signed in successfully");
            onSuccess();
            return;
          } catch (retryError) {
            console.error(retryError);
          }
        }
        console.error(error);
        toast.error("Could not sign in");
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess, signIn]
  );

  const handleAnonymousSignIn = useCallback(async () => {
    if (!FLAGS.ANONYMOUS_AUTH_ENABLED) return;

    setSubmitting(true);
    try {
      const result = await signIn("anonymous");
      if (!result.signingIn) {
        toast.error("Anonymous sign-in could not be completed");
        return;
      }
      toast.success("Signed in anonymously");
      onSuccess();
    } catch (error) {
      if (isRefreshTokenParseError(error)) {
        try {
          await clearAuthCookies();
          const retryResult = await signIn("anonymous");
          if (!retryResult.signingIn) {
            toast.error("Anonymous sign-in could not be completed");
            return;
          }
          toast.success("Signed in anonymously");
          onSuccess();
          return;
        } catch (retryError) {
          console.error(retryError);
        }
      }
      console.error(error);
      toast.error("Could not sign in anonymously");
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess, signIn]);

  return {
    submitting,
    handleSubmit,
    handleAnonymousSignIn,
  };
}
