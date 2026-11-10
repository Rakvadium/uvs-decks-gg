"use client";

import { PageHeading } from "@/components/ui/typography-headings";
import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Send } from "lucide-react";
import { PASSWORD_REQUIREMENTS, passwordRequirementError } from "../../../convex/lib/password";
import type { AuthDialogFlow } from "./dialog-flow";
import { clearAuthCookies, isRefreshTokenParseError } from "./auth-recovery";

type SignIn = ReturnType<typeof useAuthActions>["signIn"];

async function signInWithRecovery(signIn: SignIn, buildForm: () => FormData) {
  try {
    return await signIn("password", buildForm());
  } catch (error) {
    if (!isRefreshTokenParseError(error)) throw error;
    await clearAuthCookies();
    return await signIn("password", buildForm());
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return fallback;
}

export function ResetPasswordFormDialog({
  setFlow,
  onSuccess,
}: {
  setFlow: (flow: AuthDialogFlow) => void;
  onSuccess: () => void;
}) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const requestedEmail = String(new FormData(form).get("email") ?? "").trim();
    setSubmitting(true);
    try {
      await signInWithRecovery(signIn, () => new FormData(form));
      setEmail(requestedEmail);
      toast.success("Reset code sent");
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Could not send a reset code. Check the email address."));
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword") ?? "");
    if (newPassword !== formData.get("confirmPassword")) {
      toast.error("Passwords do not match");
      return;
    }
    const passwordError = passwordRequirementError(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await signInWithRecovery(signIn, () => new FormData(form));
      if (!result.signingIn) {
        toast.error("Password reset requires an additional step");
        return;
      }
      toast.success("Password updated");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Could not reset password. The code may be wrong or expired."));
    } finally {
      setSubmitting(false);
    }
  };

  if (email !== null) {
    return (
      <>
        <div className="mb-6 text-center">
          <PageHeading size="lg">Check your email</PageHeading>
          <p className="mt-2 text-muted-foreground">
            Enter the 8-digit code we sent to {email} and choose a new password.
          </p>
        </div>
        <form className="flex flex-col" onSubmit={verifyCode}>
          <input name="email" value={email} type="hidden" />
          <input name="flow" value="reset-verification" type="hidden" />
          <div className="mt-4 flex items-center justify-between py-1">
            <label htmlFor="dialog-reset-code">Code</label>
          </div>
          <Input
            name="code"
            id="dialog-reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
          <div className="mt-4 flex items-center justify-between py-1">
            <label htmlFor="dialog-reset-password">New password</label>
          </div>
          <Input
            type="password"
            name="newPassword"
            id="dialog-reset-password"
            autoComplete="new-password"
            aria-describedby="dialog-reset-password-hint"
            required
          />
          <p id="dialog-reset-password-hint" className="mt-1 text-sm text-muted-foreground">
            {PASSWORD_REQUIREMENTS}
          </p>
          <div className="mt-4 flex items-center justify-between py-1">
            <label htmlFor="dialog-reset-confirm">Confirm new password</label>
          </div>
          <Input
            type="password"
            name="confirmPassword"
            id="dialog-reset-confirm"
            autoComplete="new-password"
            required
          />

          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" type="button" onClick={() => setEmail(null)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button type="submit" disabled={submitting}>
              Reset Password
              <KeyRound className="size-4" />
            </Button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <PageHeading size="lg">Reset password</PageHeading>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we&apos;ll send you a reset code
        </p>
      </div>
      <form className="flex flex-col" onSubmit={requestCode}>
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-reset-email">Email</label>
        </div>
        <Input name="email" id="dialog-reset-email" autoComplete="email" required />
        <input name="flow" value="reset" type="hidden" />

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            type="button"
            onClick={() => setFlow("signIn")}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="submit" disabled={submitting}>
            Send Reset Code
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}
