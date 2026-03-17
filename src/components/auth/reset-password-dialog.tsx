"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import type { AuthDialogFlow } from "./dialog-flow";
import { clearAuthCookies, isRefreshTokenParseError } from "./auth-recovery";

export function ResetPasswordFormDialog({
  setFlow,
}: {
  setFlow: (flow: AuthDialogFlow) => void;
}) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <>
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;ve sent you a link to reset your password.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setFlow("signIn")}
        >
          <ArrowLeft className="size-4" />
          Back to Sign In
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>
      <form
        className="flex flex-col"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          const form = event.currentTarget;

          try {
            await signIn("password", new FormData(form));
            setSent(true);
            toast.success("Reset link sent!");
          } catch (error) {
            if (isRefreshTokenParseError(error)) {
              try {
                await clearAuthCookies();
                await signIn("password", new FormData(form));
                setSent(true);
                toast.success("Reset link sent!");
                return;
              } catch (retryError) {
                console.error(retryError);
              }
            }
            console.error(error);
            toast.error("Could not send reset link");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="flex items-center justify-between mt-4 py-1">
          <label htmlFor="dialog-reset-email">Email</label>
        </div>
        <Input name="email" id="dialog-reset-email" autoComplete="email" />
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
            Send Reset Link
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}
