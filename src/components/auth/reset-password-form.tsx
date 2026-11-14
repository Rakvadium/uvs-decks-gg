"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/typography-headings";
import { PASSWORD_REQUIREMENTS, passwordRequirementError } from "../../../convex/lib/password";
import { AuthField } from "./auth-field";
import type { AuthFlow } from "./flow";
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

function ResetHeader({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="-ml-2 self-start text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>
      <div className="space-y-1">
        <SectionHeading size="lg">{title}</SectionHeading>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ResetPasswordForm({
  setFlow,
  onSuccess,
}: {
  setFlow: (flow: AuthFlow) => void;
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
        <ResetHeader
          title="Check your email"
          description={`Enter the 8-digit code we sent to ${email} and choose a new password.`}
          onBack={() => setEmail(null)}
        />
        <form className="flex flex-col gap-5" onSubmit={verifyCode}>
          <input name="email" value={email} type="hidden" />
          <input name="flow" value="reset-verification" type="hidden" />
          <AuthField
            id="reset-code"
            name="code"
            label="Code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
          />
          <AuthField
            id="reset-new-password"
            name="newPassword"
            type="password"
            label="New password"
            autoComplete="new-password"
            required
            hint={PASSWORD_REQUIREMENTS}
          />
          <AuthField
            id="reset-confirm-password"
            name="confirmPassword"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            required
          />
          <Button type="submit" className="mt-2 w-full" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password"}
            <KeyRound className="size-4" />
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <ResetHeader
        title="Reset your password"
        description="Enter your email and we'll send you a reset code."
        onBack={() => setFlow("signIn")}
      />
      <form className="flex flex-col gap-5" onSubmit={requestCode}>
        <AuthField
          id="reset-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          autoFocus
        />
        <input name="flow" value="reset" type="hidden" />
        <Button type="submit" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset code"}
          <Send className="size-4" />
        </Button>
      </form>
    </>
  );
}
