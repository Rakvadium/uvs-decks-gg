import { useCallback, useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { FLAGS } from "@/lib/flags";

export function useSignInDialogModel(onSuccess: () => void) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      try {
        const formData = new FormData(event.currentTarget);
        await signIn("password", formData);
        toast.success("Signed in successfully");
        onSuccess();
      } catch (error) {
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
      await signIn("anonymous");
      toast.success("Signed in anonymously");
      onSuccess();
    } catch (error) {
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
